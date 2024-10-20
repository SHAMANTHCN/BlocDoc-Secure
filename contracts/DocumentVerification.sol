// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

contract DocumentVerification {
    address public owner;

    event ConstructorCalled(address sender);

    constructor() {
        emit ConstructorCalled(msg.sender);
        owner = msg.sender;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}
