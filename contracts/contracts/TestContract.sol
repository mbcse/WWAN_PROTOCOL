// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestContract {
    // State variables
    uint public param1;
    string public param2;

    // Constructor with two parameters
    constructor(uint _param1, string memory _param2) {
        param1 = _param1;
        param2 = _param2;
    }

    // Function to update parameters (for demonstration)
    function updateParams(uint _newParam1, string memory _newParam2) public {
        param1 = _newParam1;
        param2 = _newParam2;
    }
}