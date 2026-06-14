// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, IERC20Burnable} from "./interfaces/IERC20.sol";

/// @title WarToken ($WAR) — GDD §12
/// @notice Fixed-supply, burnable utility token. There is NO mint function after
///         construction: rewards are redistributed sinks, never freshly minted (the
///         §12.2 "not a reward printer" invariant lives in RewardDistributor).
contract WarToken is IERC20Burnable {
    string public constant name = "Warlands";
    string public constant symbol = "WAR";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    error InsufficientBalance();
    error InsufficientAllowance();
    error ZeroAddress();

    /// @param initialHolder receives the entire fixed supply (e.g. a treasury/distribution multisig).
    /// @param supply the immutable max supply (e.g. 1_000_000_000e18).
    constructor(address initialHolder, uint256 supply) {
        if (initialHolder == address(0)) revert ZeroAddress();
        totalSupply = supply;
        balanceOf[initialHolder] = supply;
        emit Transfer(address(0), initialHolder, supply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /// @notice Permanently destroy `amount` of the caller's tokens (deflationary sink).
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Burn from `account` using the caller's allowance (used by SinkRouter).
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    // --- internals ---

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - amount;
            totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    function _spendAllowance(address from, address spender, uint256 amount) internal {
        uint256 allowed = allowance[from][spender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert InsufficientAllowance();
            unchecked {
                allowance[from][spender] = allowed - amount;
            }
        }
    }
}
