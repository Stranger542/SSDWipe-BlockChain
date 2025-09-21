// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OperatorRegistry is Ownable {
    mapping(address => bool) private _operators;

    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function addOperator(address operator) public onlyOwner {
        require(operator != address(0), "Operator cannot be the zero address");
        _operators[operator] = true;
        emit OperatorAdded(operator);
    }

    function removeOperator(address operator) public onlyOwner {
        _operators[operator] = false;
        emit OperatorRemoved(operator);
    }

    function isOperator(address operator) public view returns (bool) {
        return _operators[operator];
    }
}