pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

contract StableTokenTimelock is Ownable {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 private _token;

    // beneficiary of tokens after they are released
    address private _beneficiary;

    // timestamp when token release is enabled
    uint256 private _releaseTime;

    // lockup supply
    uint256 private _lockupSupply;

    event TimelockTransfer(address receiver, uint256 availableAmount, uint256 amount);

    constructor (
        IERC20 token,
        address beneficiary,
        uint256 releaseTime,
        uint256 lockupSupply
    ) public {
        // solhint-disable-next-line not-rely-on-time
        require(releaseTime > block.timestamp, "StableTokenTimelock: release time is before current time");
        // require(_token.balanceOf(address(this)) >= lockupSupply, "StableTokenTimelock: Lockup supply exceeds token total supply");
        _token = token;
        _beneficiary = beneficiary;
        _releaseTime = releaseTime;
        _lockupSupply = lockupSupply;
    }

    /**
     * @return the token being held.
     */
    function token() public view returns (IERC20) {
        return _token;
    }

    /**
     * @return the beneficiary of the tokens.
     */
    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @return the time when the tokens are released.
     */
    function releaseTime() public view returns (uint256) {
        return _releaseTime;
    }

    /**
     * @return the lockup supply.
     */
    function lockupSupply() public view returns (uint256) {
        return _lockupSupply;
    }

    /**
     * @notice See `IERC20.transfer`.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount) public onlyOwner returns (bool) {
        uint256 availableAmount = _token.balanceOf(address(this)) - _lockupSupply;
        emit TimelockTransfer(recipient, availableAmount, amount);
        require(availableAmount >= amount, "StableTokenTimelock: Insufficient funds");
        _token.safeTransfer(recipient, amount);
    }

    /**
     * @notice Transfers tokens held by timelock to beneficiary.
     */
    function release() public {
        // solhint-disable-next-line not-rely-on-time
        require(block.timestamp >= _releaseTime, "TokenTimelock: current time is before release time");

        uint256 amount = _token.balanceOf(address(this));
        require(amount > 0, "TokenTimelock: no tokens to release");

        _token.safeTransfer(_beneficiary, amount);
    }
}