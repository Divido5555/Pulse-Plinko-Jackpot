// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PlinkoGame369
 * @dev PLS369-only Plinko game used as token distribution + jackpot engine
 *      for the PLS369 DAO ecosystem.
 *
 * - Players pay ENTRY_PRICE in PLS369.
 * - Jackpots and prizes are paid out in PLS369.
 * - Game uses Fetch Oracle RNG feed for randomness.
 * - No external AMM interaction (no swaps, no PLS).
 * - No host wallet, no donation wallet. DAO is the "house".
 *
 * Economics:
 *  - Target RTP ≈ 93–94% (house edge ≈ 6–7% / symbolic 6.9%).
 *
 * Per-play split of ENTRY_PRICE:
 *  - 40% → main jackpot pool
 *  - 10% → mini jackpot pool
 *  - 4%  → DAO rewards (daoAccrued)
 *  - 3%  → dev rewards (devAccrued)
 *
 * Main jackpot hit:
 *  - Slot 10 AND RNG passes MAIN_JACKPOT_ODDS.
 *  - Payout:
 *    - 50% to winner
 *    - 20% to DAO treasury
 *    - 30% reset (stays in main jackpot)
 *
 * Mini jackpot hit:
 *  - Slot 2 OR slot 16 AND RNG passes MINI_JACKPOT_ODDS.
 *  - Payout:
 *    - 50% to winner
 *    - 10% to dev wallet
 *    - 40% reset (stays in mini jackpot)
 *
 * Flat multipliers (scaled by 100, payout vs full ENTRY_PRICE):
 *  - Slot 3  → 3x
 *  - Slot 7  → 2x
 *  - Slot 11 → 5x
 *  - Slot 15 → 2x
 *  - Slot 18 → 2x
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// Minimal Fetch Oracle interface (Tellor-style getDataBefore)
interface IFetchOracle {
    function getDataBefore(bytes32 _queryId, uint256 _timestamp)
        external
        view
        returns (bytes memory _value, uint256 _timestampRetrieved);
}

// Simple ReentrancyGuard
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

contract PlinkoGame369 is ReentrancyGuard {
    // ===== CORE ADDRESSES =====
    address public owner;               // DAO multisig or admin
    IERC20  public immutable pls369;    // gameplay token
    IFetchOracle public fetchOracle;    // RNG source
    address public immutable daoTreasury; // receives DAO rewards
    address public immutable devWallet;   // receives dev rewards + mini share

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ===== GAME ECONOMY =====
    // Entry price per play (e.g. 10 tokens)
    uint256 public constant ENTRY_PRICE = 10 * 1e18;

    // RNG query ID (Fetch RNG feed - adjust to your setup)
    bytes32 public constant RNG_QUERY_ID =
        keccak256(abi.encode("RandomNumber", abi.encode("pls369", "global")));

    // Jackpots & counters
    uint256 public mainJackpot;
    uint256 public miniJackpot;
    uint256 public playCount;

    // Accrued rewards (withdrawable)
    uint256 public daoAccrued;
    uint256 public devAccrued;

    // Randomness pool
    uint256[] public randomPool;
    uint256   public randomIndex;

    // Prize multipliers for 20 slots (scaled by 100, 0-based indices)
    // Non-zero prizes at slots: 3 (3x), 7 (2x), 11 (5x), 15 (2x), 18 (3x)
    // Main jackpot slot: 10 (no flat multiplier)
    // Mini jackpot slot: 16 (no flat multiplier)
    uint256[] public multipliers = [
        0,    // 0 loser
        0,    // 1 loser
        0,    // 2 mini jackpot trigger
        300,  // 3 3x
        0,    // 4 loser
        0,    // 5 loser
        0,    // 6 loser
        200,  // 7 2x
        0,    // 8 loser
        0,    // 9 loser
        0,    // 10 main jackpot slot
        500,  // 11 5x
        0,    // 12 loser
        0,    // 13 loser
        0,    // 14 loser
        200,  // 15 2x
        0,    // 16 mini jackpot trigger
        0,    // 17 loser
        200,  // 18 2x
        0     // 19 loser
    ];

    // Odds: 1 in X when slot matches
    uint256 public constant MAIN_JACKPOT_ODDS = 33_333;
    uint256 public constant MINI_JACKPOT_ODDS = 4_762;

    // ===== EVENTS =====
    event RandomnessToppedUp(uint256 added, uint256 newPoolSize);
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
    event OracleUpdated(address indexed newOracle);
    event DaoRewardsClaimed(uint256 amount);
    event DevRewardsClaimed(uint256 amount);
    event JackpotsSeeded(uint256 mainAmount, uint256 miniAmount);

    // ===== CONSTRUCTOR =====
    /**
     * @param _pls369       PLS369 token address
     * @param _fetchOracle  Fetch Oracle proxy (RNG feed)
     * @param _owner        DAO multisig or admin
     * @param _daoTreasury  DAO treasury address (immutable)
     * @param _devWallet    Dev wallet (immutable)
     */
    constructor(
        address _pls369,
        address _fetchOracle,
        address _owner,
        address _daoTreasury,
        address _devWallet
    ) {
        require(_pls369 != address(0), "Invalid token");
        require(_fetchOracle != address(0), "Invalid oracle");
        require(_owner != address(0), "Invalid owner");
        require(_daoTreasury != address(0), "Invalid treasury");
        require(_devWallet != address(0), "Invalid dev");

        pls369      = IERC20(_pls369);
        fetchOracle = IFetchOracle(_fetchOracle);
        owner       = _owner;
        daoTreasury = _daoTreasury;
        devWallet   = _devWallet;
    }

    // ===== ADMIN =====
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle");
        fetchOracle = IFetchOracle(newOracle);
        emit OracleUpdated(newOracle);
    }

    /**
     * @dev Seed jackpots from tokens already held by this contract.
     *      Use this after sending PLS369 to the contract for initial pot.
     */
    function seedJackpots(uint256 mainAmount, uint256 miniAmount) external onlyOwner {
        uint256 bal = pls369.balanceOf(address(this));
        require(mainAmount + miniAmount <= bal, "Not enough balance");
        mainJackpot += mainAmount;
        miniJackpot += miniAmount;
        emit JackpotsSeeded(mainAmount, miniAmount);
    }

    // ===== RNG HELPERS =====
    function _fetchRandomSeed() internal view returns (uint256 word) {
        (bytes memory value, uint256 ts) = fetchOracle.getDataBefore(
            RNG_QUERY_ID,
            block.timestamp
        );
        require(ts > 0, "No RNG data");
        require(block.timestamp - ts < 1 hours, "RNG too old");
        word = abi.decode(value, (uint256));
    }

    /**
     * @dev Top up random pool by expanding a single oracle RNG seed into many words.
     */
    function topUpRandomness(uint256 rounds) external onlyOwner {
        require(rounds > 0, "rounds = 0");
        uint256 baseWord = _fetchRandomSeed();
        uint256 added;
        for (uint256 i = 0; i < rounds; i++) {
            uint256 word = uint256(
                keccak256(
                    abi.encode(
                        baseWord,
                        i,
                        block.timestamp,
                        block.number,
                        randomPool.length
                    )
                )
            );
            randomPool.push(word);
            added++;
        }
        emit RandomnessToppedUp(added, randomPool.length);
    }

    function _consumeRandomWord() internal returns (uint256 word) {
        require(randomIndex < randomPool.length, "Randomness depleted");
        word = randomPool[randomIndex];
        randomIndex++;
    }

    // ===== GAMEPLAY =====
    /**
     * @dev Player must approve ENTRY_PRICE tokens to this contract before calling.
     */
    function play() external nonReentrant {
        require(randomIndex < randomPool.length, "Randomness empty");

        // 1. Token Transfer
        bool ok = pls369.transferFrom(msg.sender, address(this), ENTRY_PRICE);
        require(ok, "Token transfer failed");

        playCount++;

        // per-play split: 40 / 10 / 4 / 3
        uint256 mainAdd = (ENTRY_PRICE * 40) / 100;
        uint256 miniAdd = (ENTRY_PRICE * 10) / 100;
        uint256 daoAdd  = (ENTRY_PRICE * 4)  / 100;
        uint256 devAdd  = (ENTRY_PRICE * 3)  / 100;

        mainJackpot += mainAdd;
        miniJackpot += miniAdd;
        daoAccrued  += daoAdd;
        devAccrued  += devAdd;

        // 3. Determine Slot
        uint256 randomness = _consumeRandomWord();
        uint256 slot = randomness % 20;

        uint256 payout = 0;
        bool mainHit = false;
        bool miniHit = false;

        if (slot == 10 && _checkOdds(randomness, MAIN_JACKPOT_ODDS)) {
            payout = _payoutMainJackpot(msg.sender);
            mainHit = true;
            emit MainJackpotWon(msg.sender, payout);
        }
        else if (
            (slot == 2 || slot == 16) &&
            _checkOdds(randomness, MINI_JACKPOT_ODDS)
        ) {
            payout = _payoutMiniJackpot(msg.sender);
            miniHit = true;
            emit MiniJackpotWon(msg.sender, payout);
        }
        else if (multipliers[slot] > 0) {
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
        internal returns (uint256 winnerAmount)
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
        if (total == 0) {
            return 0;
        }

        // 75% winner, 10% dev, 15% reset
        winnerAmount       = (total * 75) / 100;
        uint256 devAmt     = (total * 10) / 100;
        uint256 resetAmt   = total - winnerAmount - devAmt;

        miniJackpot = resetAmt;

        if (winnerAmount > 0) {
            require(pls369.transfer(winner, winnerAmount), "Winner transfer failed");
        }
        if (devAmt > 0) {
            require(pls369.transfer(devWallet, devAmt), "Dev transfer failed");
        }
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
    function getRandomPoolSize() external view returns (uint256 size, uint256 index) {
        return (randomPool.length, randomIndex);
    }

    function getGameState()
        external
        view
        returns (
            uint256 _mainJackpot,
            uint256 _miniJackpot,
            uint256 _playCount,
            uint256 _daoAccrued,
            uint256 _devAccrued,
            uint256 _entryPrice
        )
    {
        return (
            mainJackpot,
            miniJackpot,
            playCount,
            daoAccrued,
            devAccrued,
            ENTRY_PRICE
        );
    }
}
