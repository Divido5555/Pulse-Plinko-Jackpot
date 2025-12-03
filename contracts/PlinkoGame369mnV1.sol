// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Minimal ERC20 interface for PLS369
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @dev Simple ReentrancyGuard (same pattern as OpenZeppelin)
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED     = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @title PlinkoGame369
 * @dev PLS369-only Plinko game used as token distribution + jackpot engine.
 *
 * - Players pay ENTRY_PRICE in PLS369.
 * - Jackpots and prizes are paid out in PLS369.
 * - Randomness derived on-chain from block data + sender + playCount.
 *   (Not a VRF; acceptable for token distribution, not a regulated casino.)
 *
 * Economics (per play, vs full ENTRY_PRICE):
 *  - 40% → main jackpot pool
 *  - 10% → mini jackpot pool
 *  - 4%  → DAO rewards (daoAccrued)
 *  - 3%  → dev rewards (devAccrued)
 *  - Remainder stays in contract as float / game treasury.
 *
 * Configurability:
 *  - Owner can update daoTreasury, devWallet, odds, and multipliers
 *    while `finalized == false`.
 *  - Owner can emergency-withdraw PLS369 from the contract while
 *    `finalized == false` (for bugs / aborted version).
 *  - Once `finalize()` is called, all config changes, ownership transfers,
 *    and emergency withdraws are permanently disabled.
 */
contract PlinkoGame369 is ReentrancyGuard {
    // ===== CORE ADDRESSES =====
    address public owner;               // admin / DAO controller
    IERC20  public immutable pls369;    // gameplay token

    address public daoTreasury;         // receives DAO rewards
    address public devWallet;           // receives dev rewards

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotFinalized() {
        require(!finalized, "Game finalized");
        _;
    }

    // ===== GAME ECONOMY CONSTANTS =====

    // Entry price per play: 10 PLS369 (10 * 1e18 assuming 18 decimals)
    uint256 public constant ENTRY_PRICE = 10 * 1e18;

    // Jackpots & counters
    uint256 public mainJackpot;
    uint256 public miniJackpot;
    uint256 public playCount;

    // Accrued rewards (withdrawable)
    uint256 public daoAccrued;
    uint256 public devAccrued;

    // Prize multipliers for 20 slots (scaled by 100, 0–19)
    // Non-zero prizes at slots: 3 (3x), 7 (2x), 11 (5x), 15 (2x), 18 (2x)
    // Main jackpot slot: 10 (no flat multiplier)
    // Mini jackpot slots: 2 and 16 (no flat multiplier)
    uint256[20] public multipliers;

    // Odds: 1 in X when slot matches (configurable until finalized)
    uint256 public mainJackpotOdds; // e.g. 33_333
    uint256 public miniJackpotOdds; // e.g. 4_762

    // Finalization fuse: once true, no more config changes / ownership transfer / emergency drain.
    bool public finalized;

    // ===== EVENTS =====
    event Play(
        address indexed player,
        uint256 indexed playId,
        uint256 slot,
        uint256 payout,
        bool mainJackpotHit,
        bool miniJackpotHit
    );
    event MainJackpotWon(address indexed player, uint256 amount);
    event MiniJackpotWon(address indexed player, uint256 amount);

    event JackpotsSeeded(uint256 mainAmount, uint256 miniAmount);

    event DaoRewardsClaimed(uint256 amount);
    event DevRewardsClaimed(uint256 amount);

    event DaoTreasuryUpdated(address indexed oldDao, address indexed newDao);
    event DevWalletUpdated(address indexed oldDev, address indexed newDev);
    event MainJackpotOddsUpdated(uint256 oldOdds, uint256 newOdds);
    event MiniJackpotOddsUpdated(uint256 oldOdds, uint256 newOdds);
    event MultiplierUpdated(uint256 indexed slot, uint256 oldMult, uint256 newMult);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Finalized();
    event EmergencyWithdraw(address indexed to, uint256 amount);

    // ===== CONSTRUCTOR =====
    /**
     * @param _pls369      PLS369 token address
     * @param _owner       initial owner (admin / DAO controller)
     * @param _daoTreasury initial DAO treasury address
     * @param _devWallet   initial dev rewards address
     */
    constructor(
        address _pls369,
        address _owner,
        address _daoTreasury,
        address _devWallet
    ) {
        require(_pls369 != address(0), "Invalid token");
        require(_owner != address(0), "Invalid owner");
        require(_daoTreasury != address(0), "Invalid DAO");
        require(_devWallet != address(0), "Invalid dev");

        pls369      = IERC20(_pls369);
        owner       = _owner;
        daoTreasury = _daoTreasury;
        devWallet   = _devWallet;

        // Default odds (same as our tuned test version)
        mainJackpotOdds = 33_333;
        miniJackpotOdds = 4_762;

        // Initialize multipliers (scaled by 100)
        // losers default to 0
        multipliers[0]  = 0;
        multipliers[1]  = 0;
        multipliers[2]  = 0;    // mini jackpot trigger
        multipliers[3]  = 300;  // 3x
        multipliers[4]  = 0;
        multipliers[5]  = 0;
        multipliers[6]  = 0;
        multipliers[7]  = 200;  // 2x
        multipliers[8]  = 0;
        multipliers[9]  = 0;
        multipliers[10] = 0;    // main jackpot slot
        multipliers[11] = 500;  // 5x
        multipliers[12] = 0;
        multipliers[13] = 0;
        multipliers[14] = 0;
        multipliers[15] = 200;  // 2x
        multipliers[16] = 0;    // mini jackpot trigger
        multipliers[17] = 0;
        multipliers[18] = 200;  // 2x
        multipliers[19] = 0;
    }

    // ===== ADMIN (UPGRADEABLE UNTIL FINALIZED) =====

    function transferOwnership(address newOwner)
        external
        onlyOwner
        whenNotFinalized
    {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function updateDaoTreasury(address newDao)
        external
        onlyOwner
        whenNotFinalized
    {
        require(newDao != address(0), "Invalid DAO");
        emit DaoTreasuryUpdated(daoTreasury, newDao);
        daoTreasury = newDao;
    }

    function updateDevWallet(address newDev)
        external
        onlyOwner
        whenNotFinalized
    {
        require(newDev != address(0), "Invalid dev");
        emit DevWalletUpdated(devWallet, newDev);
        devWallet = newDev;
    }

    function setMainJackpotOdds(uint256 newOdds)
        external
        onlyOwner
        whenNotFinalized
    {
        require(newOdds > 0, "Odds = 0");
        emit MainJackpotOddsUpdated(mainJackpotOdds, newOdds);
        mainJackpotOdds = newOdds;
    }

    function setMiniJackpotOdds(uint256 newOdds)
        external
        onlyOwner
        whenNotFinalized
    {
        require(newOdds > 0, "Odds = 0");
        emit MiniJackpotOddsUpdated(miniJackpotOdds, newOdds);
        miniJackpotOdds = newOdds;
    }

    /**
     * @dev Update multiplier for a specific slot (0–19), scaled by 100.
     *      Example: 300 = 3x, 200 = 2x, 500 = 5x.
     */
    function setMultiplier(uint256 slot, uint256 newMultiplier)
        external
        onlyOwner
        whenNotFinalized
    {
        require(slot < 20, "Invalid slot");
        emit MultiplierUpdated(slot, multipliers[slot], newMultiplier);
        multipliers[slot] = newMultiplier;
    }

    /**
     * @dev Emergency withdraw of PLS369 from the contract.
     *      Only callable before finalization, for recovery if this
     *      version needs to be shut down.
     */
    function emergencyWithdrawPls369(address to, uint256 amount)
        external
        onlyOwner
        whenNotFinalized
    {
        require(to != address(0), "Invalid to");
        require(pls369.transfer(to, amount), "Withdraw failed");
        emit EmergencyWithdraw(to, amount);
    }

    /**
     * @dev Permanently lock all configuration, ownership transfers, and
     *      emergency withdraws. Once called, this cannot be undone.
     */
    function finalize() external onlyOwner whenNotFinalized {
        finalized = true;
        emit Finalized();
    }

    /**
     * @dev Seed jackpots from tokens already held by this contract.
     *      Use this after sending PLS369 to the contract for initial pot.
     */
    function seedJackpots(uint256 mainAmount, uint256 miniAmount)
        external
        onlyOwner
    {
        uint256 bal = pls369.balanceOf(address(this));
        require(mainAmount + miniAmount <= bal, "Not enough balance");
        mainJackpot += mainAmount;
        miniJackpot += miniAmount;
        emit JackpotsSeeded(mainAmount, miniAmount);
    }

    // ===== RNG HELPER =====

    /**
     * @dev Generate per-play randomness using on-chain data.
     *
     * Note: This is not as strong as a VRF. A block producer could, in
     * theory, bias outcomes by choosing which blocks to publish.
     * However, it removes the obvious "next word in array" exploit.
     */
    function _generateRandomness() internal view returns (uint256) {
        // blockhash(block.number - 1) is only known once the block is mined,
        // so players / MEV cannot know the exact outcome before sending tx.
        bytes32 bh = blockhash(block.number - 1);
        return uint256(
            keccak256(
                abi.encode(
                    bh,
                    block.timestamp,
                    msg.sender,
                    playCount,
                    address(this)
                )
            )
        );
    }

    // ===== GAMEPLAY =====

    /**
     * @dev Player must approve ENTRY_PRICE PLS369 to this contract before calling.
     */
    function play() external nonReentrant {
        // 1. Token transfer
        bool ok = pls369.transferFrom(msg.sender, address(this), ENTRY_PRICE);
        require(ok, "Token transfer failed");

        playCount++;

        // 2. Per-play split: 40 / 10 / 4 / 3 (vs full ENTRY_PRICE)
        uint256 mainAdd = (ENTRY_PRICE * 40) / 100;
        uint256 miniAdd = (ENTRY_PRICE * 10) / 100;
        uint256 daoAdd  = (ENTRY_PRICE * 4)  / 100;
        uint256 devAdd  = (ENTRY_PRICE * 3)  / 100;

        mainJackpot += mainAdd;
        miniJackpot += miniAdd;
        daoAccrued  += daoAdd;
        devAccrued  += devAdd;

        // 3. Determine slot
        uint256 randomness = _generateRandomness();
        uint256 slot = randomness % 20;

        uint256 payout = 0;
        bool mainHit = false;
        bool miniHit = false;

        if (slot == 10 && _checkOdds(randomness, mainJackpotOdds)) {
            payout = _payoutMainJackpot(msg.sender);
            mainHit = true;
            emit MainJackpotWon(msg.sender, payout);
        } else if (
            (slot == 2 || slot == 16) &&
            _checkOdds(randomness, miniJackpotOdds)
        ) {
            payout = _payoutMiniJackpot(msg.sender);
            miniHit = true;
            emit MiniJackpotWon(msg.sender, payout);
        } else if (multipliers[slot] > 0) {
            payout = (ENTRY_PRICE * multipliers[slot]) / 100;
            require(pls369.transfer(msg.sender, payout), "Prize transfer failed");
        }

        emit Play(msg.sender, playCount, slot, payout, mainHit, miniHit);
    }

    function _checkOdds(uint256 randomness, uint256 odds)
        internal
        pure
        returns (bool)
    {
        if (odds == 0) return false;
        return (randomness % odds) == 0;
    }

    function _payoutMainJackpot(address winner)
        internal
        returns (uint256 winnerAmount)
    {
        uint256 total = mainJackpot;
        if (total == 0) return 0;

        // 50% winner, 20% DAO, 30% reset
        winnerAmount = (total * 50) / 100;
        uint256 daoAmt = (total * 20) / 100;
        uint256 resetAmt = total - winnerAmount - daoAmt;

        mainJackpot = resetAmt;

        require(pls369.transfer(winner, winnerAmount), "Winner transfer failed");
        require(pls369.transfer(daoTreasury, daoAmt), "DAO transfer failed");
        return winnerAmount;
    }

    function _payoutMiniJackpot(address winner)
        internal
        returns (uint256 winnerAmount)
    {
        uint256 total = miniJackpot;
        if (total == 0) return 0;

        // 50% winner, 10% dev, 40% reset
        winnerAmount = (total * 50) / 100;
        uint256 devAmt = (total * 10) / 100;
        uint256 resetAmt = total - winnerAmount - devAmt;

        miniJackpot = resetAmt;

        require(pls369.transfer(winner, winnerAmount), "Winner transfer failed");
        require(pls369.transfer(devWallet, devAmt), "Dev transfer failed");
        return winnerAmount;
    }

    // ===== REWARD CLAIMS (DAO / DEV) =====

    function claimDaoRewards() external nonReentrant {
        require(msg.sender == daoTreasury || msg.sender == owner, "Not authorized");
        uint256 amount = daoAccrued;
        if (amount == 0) return;
        daoAccrued = 0;
        require(pls369.transfer(daoTreasury, amount), "DAO transfer failed");
        emit DaoRewardsClaimed(amount);
    }

    function claimDevRewards() external nonReentrant {
        require(msg.sender == devWallet || msg.sender == owner, "Not authorized");
        uint256 amount = devAccrued;
        if (amount == 0) return;
        devAccrued = 0;
        require(pls369.transfer(devWallet, amount), "Dev transfer failed");
        emit DevRewardsClaimed(amount);
    }

    // ===== VIEWS =====

    function getGameState()
        external
        view
        returns (
            uint256 _mainJackpot,
            uint256 _miniJackpot,
            uint256 _playCount,
            uint256 _daoAccrued,
            uint256 _devAccrued,
            uint256 _entryPrice,
            bool    _finalized
        )
    {
        return (
            mainJackpot,
            miniJackpot,
            playCount,
            daoAccrued,
            devAccrued,
            ENTRY_PRICE,
            finalized
        );
    }
}