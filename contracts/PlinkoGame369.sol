// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PlinkoGame369
 * @dev PLS369-only Plinko game for PLS369 DAO:
 *      - Players pay ENTRY_PRICE in PLS369.
 *      - Prizes & jackpots paid in PLS369.
 *      - Fetch Oracle RNG feed for randomness.
 *      - No host wallet, no donation wallet; DAO is the house.
 *
 * Economics (per play, in expectation):
 *  - Target player RTP ≈ 93–94% (house edge ≈ 6–7%).
 *  - EV from flat prizes via 2x/3x/5x slots.
 *  - EV from main + mini jackpots.
 *  - ~7% EV captured by DAO + dev (symbolic 6.9% target).
 *
 * Per-play split of ENTRY_PRICE tokens:
 *  - 40% → main jackpot pool
 *  - 10% → mini jackpot pool
 *  - 4%  → DAO rewards (daoAccrued)
 *  - 3%  → dev rewards (devAccrued)
 *
 * Jackpots:
 *  - Main jackpot hit: slot 10 (odds via MAIN_JACKPOT_ODDS)
 *    - 50% to winner
 *    - 20% to DAO treasury
 *    - 30% stays in jackpot (reset)
 *
 *  - Mini jackpot hit: slots 2 or 16 (odds via MINI_JACKPOT_ODDS)
 *    - 50% to winner
 *    - 10% to dev wallet
 *    - 40% stays in mini jackpot (reset)
 *
 * Flat prize multipliers (scaled by 100, on full ENTRY_PRICE):
 *  - 5 winning slots:
 *    - slot 3  → 3.0x
 *    - slot 7  → 2.0x
 *    - slot 11 → 5.0x
 *    - slot 15 → 2.0x
 *    - slot 18 → 2.0x
 *
 * Mini jackpot trigger slots:
 *  - slot 2, slot 16
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
    address public owner;
    IERC20  public immutable pls369;
    IFetchOracle public fetchOracle;
    address public immutable daoTreasury;
    address public immutable devWallet;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ===== GAME ECONOMY =====
    uint256 public constant ENTRY_PRICE = 10 * 1e18;

    bytes32 public constant RNG_QUERY_ID =
        keccak256(abi.encode("RandomNumber", abi.encode("pls369", "global")));

    uint256 public mainJackpot;
    uint256 public miniJackpot;
    uint256 public playCount;

    uint256 public daoAccrued;
    uint256 public devAccrued;

    uint256[] public randomPool;
    uint256   public randomIndex;

    // Prize multipliers for 20 slots (scaled by 100, 0-based indices)
    uint256[] public multipliers = [
        0,    // 0
        0,    // 1
        0,    // 2 - mini jackpot
        300,  // 3 - 3x
        0,    // 4
        0,    // 5
        0,    // 6
        200,  // 7 - 2x
        0,    // 8
        0,    // 9
        0,    // 10 - main jackpot
        500,  // 11 - 5x
        0,    // 12
        0,    // 13
        0,    // 14
        200,  // 15 - 2x
        0,    // 16 - mini jackpot
        0,    // 17
        200,  // 18 - 2x
        0     // 19
    ];

    uint256 public constant MAIN_JACKPOT_ODDS = 33_333; // 1 in 33,333
    uint256 public constant MINI_JACKPOT_ODDS = 4_762;  // 1 in 4,762

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
    function play() external nonReentrant {
        require(randomIndex < randomPool.length, "Randomness empty");

        // 1. Token Transfer
        bool ok = pls369.transferFrom(msg.sender, address(this), ENTRY_PRICE);
        require(ok, "Token transfer failed");

        playCount++;

        // 2. Per-play split
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

        // 4. Check for jackpots or prizes
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
            if (payout > 0) {
                bool pOk = pls369.transfer(msg.sender, payout);
                require(pOk, "Prize transfer failed");
            }
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
        if (total == 0) {
            return 0;
        }

        // 50% winner, 20% DAO, 30% reset
        winnerAmount       = (total * 50) / 100;
        uint256 daoAmt     = (total * 20) / 100;
        uint256 resetAmt   = total - winnerAmount - daoAmt;

        mainJackpot = resetAmt;

        if (winnerAmount > 0) {
            require(pls369.transfer(winner, winnerAmount), "Winner transfer failed");
        }
        if (daoAmt > 0) {
            require(pls369.transfer(daoTreasury, daoAmt), "DAO transfer failed");
        }
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

        // 50% winner, 10% dev, 40% reset
        winnerAmount       = (total * 50) / 100;
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
        ) {
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