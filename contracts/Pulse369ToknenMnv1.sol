// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PLS369Token
 * @dev Fixed-supply ERC20 token for the PLS369 DAO ecosystem.
 *      - No taxes, no burns, no rebasing.
 *      - Full supply minted to the deployer (DAO multisig recommended).
 *      - Distribution (treasury, LP, game, team) is handled off-chain by DAO.
 */
contract PLS369Token {
    string public constant name = "PLS369 DAO";
    string public constant symbol = "PLS369";
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        // 369,000,000 * 1e18
        uint256 supply = 369_000_000 * 10 ** uint256(decimals);
        totalSupply = supply;
        _balances[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
    }

    // ===== ERC20 VIEW =====
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    // ===== ERC20 CORE =====
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        unchecked {
            _approve(from, msg.sender, currentAllowance - amount);
        }
        _transfer(from, to, amount);
        return true;
    }

    // ===== INTERNALS =====
    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "ERC20: transfer to zero");
        uint256 fromBal = _balances[from];
        require(fromBal >= amount, "ERC20: transfer exceeds balance");
        unchecked {
            _balances[from] = fromBal - amount;
        }
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(spender != address(0), "ERC20: approve to zero");
        require(owner != address(0), "ERC20: approve from zero");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
