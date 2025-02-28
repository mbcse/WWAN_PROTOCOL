// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
contract TestUpgradableContract is Initializable, UUPSUpgradeable {
    // State variables
    uint public param1;
    string public param2;
    address owner;
    string public param3;
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    function initialize(uint _param1, string memory _param2) public initializer {
        param1 = _param1;
        param2 = _param2;
        __UUPSUpgradeable_init();
        owner = msg.sender;
    }

    // Function to update parameters (for demonstration)
    function updateParams(uint _newParam1, string memory _newParam2) public {
        param1 = _newParam1;
        param2 = _newParam2;
    }

    modifier onlyUpgrader() {
        require(
            owner == msg.sender,
            "Unauthorized Access");
        _;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyUpgrader
        override
    {}
}