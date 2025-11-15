// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PlinkoGameVRF
 * @dev Fully on-chain Plinko game with VRF randomness and price oracle
 * - anyrand VRF (drand-based) for verifiable randomness
 * - Fetch Oracle (Tellor-based) for PLS/USD price
 * - Dynamic entry fee (~$1 USD equivalent in PLS)
 * - Identical jackpot logic as PlinkoGame.sol
 */

// Interface for anyrand VRF
interface IAnyrand {
    function requestRandomness(
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
    
    function estimateFee(uint32 callbackGasLimit) external view returns (uint256);
}

// Interface for Fetch Oracle (UsingFetch pattern)
interface IFetchOracle {
    function getDataBefore(bytes32 queryId, uint256 timestamp) 
        external 
        view 
        returns (bytes memory value, uint256 timestampRetrieved);
}

contract PlinkoGameVRF {
    // ===== STATE VARIABLES =====
    address public owner;
    address public devWallet;
    address public hostWallet;
    address public burnAddress;
    address public treasuryWallet;
    
    IAnyrand public anyrandVRF;
    IFetchOracle public fetchOracle;
    
    uint256 public mainJackpot;
    uint256 public miniJackpot;
    uint256 public hostAccumulated;
    uint256 public playCount;
    
    // Prize multipliers for 20 slots (scaled by 100, e.g., 110 = 1.1x)
    // Layout: slots 12-16 have prizes, slot 10 = main jackpot, slot 16 = mini jackpot
    uint256[] public multipliers = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // 0-9: losers
        0,                               // 10: main jackpot slot
        0,                               // 11: loser
        110, 150, 200, 300,             // 12-15: prizes
        500,                             // 16: mini jackpot slot (also has prize)
        0, 0, 0, 0                      // 17-19: losers
    ];
    
    // Fetch Oracle query ID for PLS/USD
    bytes32 public constant PLS_USD_QUERY_ID = keccak256(abi.encode("SpotPrice", abi.encode("pls", "usd")));
    
    // Target entry price in USD (scaled by 1e6, so 1000000 = $1)
    uint256 public constant TARGET_ENTRY_USD = 1000000; // $1
    
    // Pending plays mapping
    struct PendingPlay {
        address player;
        uint256 entryAmount;
        uint32 callbackGasLimit;
        bool fulfilled;
    }
    
    mapping(uint256 => PendingPlay) public pendingPlays;
    
    // ===== EVENTS =====
    event PlayRequested(
        address indexed player,
        uint256 indexed requestId,
        uint256 entryAmount,
        uint256 vrfFee
    );
    
    event PlayResolved(
        address indexed player,
        uint256 indexed requestId,
        uint256 slot,
        uint256 payout,
        bool isJackpot
    );
    
    event MainJackpotWon(
        address indexed winner,
        uint256 amount,
        uint256 slot
    );
    
    event MiniJackpotWon(
        address indexed winner,
        uint256 amount,
        uint256 slot
    );
    
    event HostPaid(
        address indexed host,
        uint256 amount
    );
    
    // ===== CONSTRUCTOR =====
    constructor(
        address _fetchOracle,
        address _anyrandVRF,
        address _devWallet,
        address _hostWallet,
        address _burnAddress,
        address _treasuryWallet
    ) {
        require(_fetchOracle != address(0), "Invalid oracle address");
        require(_anyrandVRF != address(0), "Invalid VRF address");
        require(_devWallet != address(0), "Invalid dev wallet");
        require(_hostWallet != address(0), "Invalid host wallet");
        require(_burnAddress != address(0), "Invalid burn address");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        
        owner = msg.sender;
        fetchOracle = IFetchOracle(_fetchOracle);
        anyrandVRF = IAnyrand(_anyrandVRF);
        devWallet = _devWallet;
        hostWallet = _hostWallet;
        burnAddress = _burnAddress;
        treasuryWallet = _treasuryWallet;
    }
    
    // ===== ORACLE FUNCTIONS =====
    
    /**
     * @dev Get current PLS/USD price from Fetch Oracle
     * @return price PLS price in USD (scaled by 1e6)
     */
    function getPLSPrice() public view returns (uint256) {
        (bytes memory value, uint256 timestamp) = fetchOracle.getDataBefore(
            PLS_USD_QUERY_ID,
            block.timestamp
        );
        
        require(timestamp > 0, "No oracle data available");
        require(block.timestamp - timestamp < 1 hours, "Oracle data too stale");
        
        uint256 price = abi.decode(value, (uint256));
        require(price > 0, "Invalid price");
        
        return price;
    }
    
    /**
     * @dev Calculate minimum entry amount in PLS for ~$1 USD
     * @return minEntryPls Minimum PLS required for entry
     */
    function getMinEntryPls() public view returns (uint256) {
        uint256 plsPrice = getPLSPrice(); // Price in USD scaled by 1e6
        
        // minEntryPls = TARGET_ENTRY_USD / plsPrice (scaled properly)
        // Both are scaled by 1e6, result in wei (1e18)
        uint256 minEntryPls = (TARGET_ENTRY_USD * 1e18) / plsPrice;
        
        return minEntryPls;
    }
    
    /**
     * @dev Get current entry requirements (entry + VRF fee)
     * @param callbackGasLimit Gas limit for VRF callback
     * @return minEntryPls Minimum PLS for game entry
     * @return vrfFee VRF service fee
     * @return totalRequired Total PLS required
     */
    function getCurrentEntryRequirements(uint32 callbackGasLimit) 
        external 
        view 
        returns (uint256 minEntryPls, uint256 vrfFee, uint256 totalRequired) 
    {
        minEntryPls = getMinEntryPls();
        vrfFee = anyrandVRF.estimateFee(callbackGasLimit);
        totalRequired = minEntryPls + vrfFee;
        
        return (minEntryPls, vrfFee, totalRequired);
    }
    
    // ===== GAME FUNCTIONS =====
    
    /**
     * @dev Request to play Plinko game (async, waits for VRF)
     * @param callbackGasLimit Gas limit for randomness callback
     */
    function play(uint32 callbackGasLimit) external payable returns (uint256 requestId) {
        uint256 minEntry = getMinEntryPls();
        uint256 vrfFee = anyrandVRF.estimateFee(callbackGasLimit);
        uint256 totalRequired = minEntry + vrfFee;
        
        require(msg.value >= totalRequired, "Insufficient payment");
        
        // Request randomness from anyrand
        requestId = anyrandVRF.requestRandomness{value: vrfFee}(
            callbackGasLimit,
            1 // numWords
        );
        
        // Store pending play
        pendingPlays[requestId] = PendingPlay({
            player: msg.sender,
            entryAmount: minEntry,
            callbackGasLimit: callbackGasLimit,
            fulfilled: false
        });
        
        // Refund excess payment
        uint256 excess = msg.value - totalRequired;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
        
        emit PlayRequested(msg.sender, requestId, minEntry, vrfFee);
        
        return requestId;
    }
    
    /**
     * @dev Callback function called by anyrand VRF
     * @param requestId Request ID from VRF
     * @param randomWords Array of random numbers
     */
    function receiveRandomness(uint256 requestId, uint256[] calldata randomWords) external {
        require(msg.sender == address(anyrandVRF), "Only VRF can fulfill");
        
        PendingPlay storage pending = pendingPlays[requestId];
        require(pending.player != address(0), "Request not found");
        require(!pending.fulfilled, "Already fulfilled");
        
        pending.fulfilled = true;
        playCount++;
        
        // Distribute entry fee
        uint256 entryAmount = pending.entryAmount;
        uint256 basePrizePool = (entryAmount * 32) / 100; // 32%
        uint256 mainJackpotAdd = (entryAmount * 50) / 100; // 50%
        uint256 miniJackpotAdd = (entryAmount * 15) / 100; // 15%
        uint256 hostFee = (entryAmount * 5) / 100; // 5%
        
        mainJackpot += mainJackpotAdd;
        miniJackpot += miniJackpotAdd;
        hostAccumulated += hostFee;
        
        // Get slot from VRF randomness (0-19)
        uint256 slot = randomWords[0] % 20;
        uint256 payout = 0;
        bool isJackpot = false;
        
        // Check for jackpots
        if (slot == 10 && _checkJackpotWin(randomWords[0], 1200000)) {
            // Main jackpot (1 in 1.2M)
            payout = _payMainJackpot(pending.player);
            isJackpot = true;
            emit MainJackpotWon(pending.player, payout, slot);
        } else if (slot == 16 && _checkJackpotWin(randomWords[0], 53000)) {
            // Mini jackpot (1 in 53k)
            payout = _payMiniJackpot(pending.player);
            isJackpot = true;
            emit MiniJackpotWon(pending.player, payout, slot);
        } else if (multipliers[slot] > 0) {
            // Regular prize
            payout = (entryAmount * multipliers[slot]) / 100;
            payable(pending.player).transfer(payout);
        }
        
        // Pay host every 1000 plays
        if (playCount % 1000 == 0 && hostAccumulated > 0) {
            uint256 hostPay = hostAccumulated;
            hostAccumulated = 0;
            payable(hostWallet).transfer(hostPay);
            emit HostPaid(hostWallet, hostPay);
        }
        
        emit PlayResolved(pending.player, requestId, slot, payout, isJackpot);
    }
    
    /**
     * @dev Check if jackpot wins based on odds and VRF randomness
     * @param randomness VRF random number
     * @param odds 1 in X chance
     */
    function _checkJackpotWin(uint256 randomness, uint256 odds) private pure returns (bool) {
        return (randomness % odds) == 0;
    }
    
    /**
     * @dev Pay main jackpot: 60% winner, 10% burn, 10% host, 10% dev, 10% reset
     */
    function _payMainJackpot(address winner) private returns (uint256) {
        uint256 total = mainJackpot;
        uint256 winnerAmount = (total * 60) / 100;
        uint256 burnAmount = (total * 10) / 100;
        uint256 hostAmount = (total * 10) / 100;
        uint256 devAmount = (total * 10) / 100;
        uint256 resetAmount = (total * 10) / 100;
        
        mainJackpot = resetAmount;
        
        payable(winner).transfer(winnerAmount);
        payable(burnAddress).transfer(burnAmount);
        payable(hostWallet).transfer(hostAmount);
        payable(devWallet).transfer(devAmount);
        
        return winnerAmount;
    }
    
    /**
     * @dev Pay mini jackpot: 80% winner, 10% host, 10% reset
     */
    function _payMiniJackpot(address winner) private returns (uint256) {
        uint256 total = miniJackpot;
        uint256 winnerAmount = (total * 80) / 100;
        uint256 hostAmount = (total * 10) / 100;
        uint256 resetAmount = (total * 10) / 100;
        
        miniJackpot = resetAmount;
        
        payable(winner).transfer(winnerAmount);
        payable(hostWallet).transfer(hostAmount);
        
        return winnerAmount;
    }
    
    // ===== VIEW FUNCTIONS =====
    
    /**
     * @dev Get current game state
     */
    function getGameState() external view returns (
        uint256 _mainJackpot,
        uint256 _miniJackpot,
        uint256 _playCount,
        uint256 _hostAccumulated,
        uint256 _minEntryPls
    ) {
        return (
            mainJackpot,
            miniJackpot,
            playCount,
            hostAccumulated,
            getMinEntryPls()
        );
    }
    
    /**
     * @dev Check if a play request is fulfilled
     */
    function isPlayFulfilled(uint256 requestId) external view returns (bool) {
        return pendingPlays[requestId].fulfilled;
    }
    
    // ===== ADMIN FUNCTIONS =====
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @dev Update oracle address (owner only)
     */
    function updateOracle(address newOracle) external {
        require(msg.sender == owner, "Only owner");
        require(newOracle != address(0), "Invalid address");
        fetchOracle = IFetchOracle(newOracle);
    }
    
    /**
     * @dev Update VRF address (owner only)
     */
    function updateVRF(address newVRF) external {
        require(msg.sender == owner, "Only owner");
        require(newVRF != address(0), "Invalid address");
        anyrandVRF = IAnyrand(newVRF);
    }
    
    receive() external payable {}
}
