// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract WWANProtocol is Initializable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    // State variables
    address public owner;
    IERC20Upgradeable public paymentToken;
    
    struct Agent {
        address agentAddress;
        string metadata;     // IPFS hash containing agent details
        bool isActive;
        uint256 reputation;
        mapping(bytes32 => bool) supportedTaskTypes;
    }

    struct Task {
        address creator;
        address assignedAgent;
        bytes32 taskType;
        string taskData;     // IPFS hash containing task details
        uint256 payment;
        TaskStatus status;
        bytes signature;     // EigenLayer AVS signature
        address[] collaboratingAgents; // For multi-agent tasks
    }

    struct UserAgentRegistry {
        address[] activeAgents;
        mapping(address => bool) isRegistered;
        mapping(address => uint256) paymentAllowance;
    }

    enum TaskStatus {
        Created,
        Assigned,
        InProgress,
        Completed,
        Disputed
    }

    mapping(address => Agent) public agents;
    mapping(uint256 => Task) public tasks;
    mapping(address => UserAgentRegistry) userAgents;
    uint256 public taskCounter;

    // Events
    event AgentRegistered(address indexed agentAddress, string metadata);
    event TaskCreated(uint256 indexed taskId, address indexed creator, bytes32 taskType);
    event TaskAssigned(uint256 indexed taskId, address indexed agent);
    event TaskCompleted(uint256 indexed taskId, bytes signature);
    event AgentRegisteredForUser(address indexed user, address indexed agent, uint256 allowance);
    event CollaborationRequested(uint256 indexed taskId, address indexed requestingAgent, address indexed targetAgent);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _paymentToken) public initializer {
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        owner = msg.sender;
        paymentToken = IERC20Upgradeable(_paymentToken);
    }

    // Agent Registration
    function registerAgent(string memory _metadata, bytes32[] memory _supportedTaskTypes) 
        external 
    {
        require(!agents[msg.sender].isActive, "Agent already registered");
        
        Agent storage newAgent = agents[msg.sender];
        newAgent.agentAddress = msg.sender;
        newAgent.metadata = _metadata;
        newAgent.isActive = true;
        newAgent.reputation = 100; // Base reputation

        for(uint i = 0; i < _supportedTaskTypes.length; i++) {
            newAgent.supportedTaskTypes[_supportedTaskTypes[i]] = true;
        }

        emit AgentRegistered(msg.sender, _metadata);
    }

    // Register agent for a user
    function registerAgentForUser(address _agentAddress, uint256 _paymentAllowance) external {
        require(agents[_agentAddress].isActive, "Agent not registered in system");
        require(!userAgents[msg.sender].isRegistered[_agentAddress], "Agent already registered for user");
        
        // Transfer payment allowance to contract
        if (_paymentAllowance > 0) {
            require(
                paymentToken.transferFrom(msg.sender, address(this), _paymentAllowance),
                "Payment allowance transfer failed"
            );
        }
        
        UserAgentRegistry storage registry = userAgents[msg.sender];
        registry.activeAgents.push(_agentAddress);
        registry.isRegistered[_agentAddress] = true;
        registry.paymentAllowance[_agentAddress] = _paymentAllowance;
        
        emit AgentRegisteredForUser(msg.sender, _agentAddress, _paymentAllowance);
    }

    // Task Creation
    function createTask(
        bytes32 _taskType,
        string memory _taskData,
        uint256 _payment,
        address[] memory _collaboratingAgents
    ) external nonReentrant {
        require(_payment > 0, "Payment must be positive");
        
        // Transfer payment to contract
        require(
            paymentToken.transferFrom(msg.sender, address(this), _payment),
            "Payment transfer failed"
        );

        uint256 taskId = taskCounter++;
        Task storage newTask = tasks[taskId];
        newTask.creator = msg.sender;
        newTask.taskType = _taskType;
        newTask.taskData = _taskData;
        newTask.payment = _payment;
        newTask.status = TaskStatus.Created;
        
        if (_collaboratingAgents.length > 0) {
            newTask.collaboratingAgents = _collaboratingAgents;
        }

        emit TaskCreated(taskId, msg.sender, _taskType);
    }

    // Task Assignment
    function assignTask(uint256 _taskId) external {
        require(agents[msg.sender].isActive, "Agent not registered");
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Created, "Task not available");
        require(agents[msg.sender].supportedTaskTypes[task.taskType], "Task type not supported");

        task.assignedAgent = msg.sender;
        task.status = TaskStatus.Assigned;

        emit TaskAssigned(_taskId, msg.sender);
    }

    // Request collaboration with another agent
    function requestCollaboration(uint256 _taskId, address _collaboratorAgent) external {
        Task storage task = tasks[_taskId];
        require(task.assignedAgent == msg.sender, "Not assigned agent");
        require(agents[_collaboratorAgent].isActive, "Collaborator not registered");
        
        bool isAlreadyCollaborating = false;
        for (uint i = 0; i < task.collaboratingAgents.length; i++) {
            if (task.collaboratingAgents[i] == _collaboratorAgent) {
                isAlreadyCollaborating = true;
                break;
            }
        }
        
        if (!isAlreadyCollaborating) {
            task.collaboratingAgents.push(_collaboratorAgent);
        }
        
        emit CollaborationRequested(_taskId, msg.sender, _collaboratorAgent);
    }

    // Task Completion with EigenLayer AVS signature
    function completeTask(uint256 _taskId, bytes memory _signature) external {
        Task storage task = tasks[_taskId];
        require(task.assignedAgent == msg.sender, "Not assigned agent");
        require(task.status == TaskStatus.Assigned || task.status == TaskStatus.InProgress, "Invalid task status");

        // Here you would verify the EigenLayer AVS signature
        // Implementation depends on EigenLayer integration

        task.signature = _signature;
        task.status = TaskStatus.Completed;

        // Transfer payment to agent
        require(
            paymentToken.transfer(msg.sender, task.payment),
            "Payment transfer failed"
        );

        emit TaskCompleted(_taskId, _signature);
    }

    // Execute task via registered agent
    function executeAgentTask(
        address _agentAddress, 
        bytes32 _taskType, 
        string memory _taskData, 
        uint256 _payment
    ) external nonReentrant {
        require(userAgents[msg.sender].isRegistered[_agentAddress], "Agent not registered for user");
        require(agents[_agentAddress].supportedTaskTypes[_taskType], "Task type not supported by agent");
        
        UserAgentRegistry storage registry = userAgents[msg.sender];
        
        // Check if we need to use allowance or direct payment
        if (_payment > 0) {
            // Direct payment
            require(
                paymentToken.transferFrom(msg.sender, address(this), _payment),
                "Payment transfer failed"
            );
        } else if (registry.paymentAllowance[_agentAddress] > 0) {
            // Use from allowance
            _payment = registry.paymentAllowance[_agentAddress] > 100 ? 100 : registry.paymentAllowance[_agentAddress];
            registry.paymentAllowance[_agentAddress] -= _payment;
        } else {
            revert("No payment provided and no allowance available");
        }
        
        uint256 taskId = taskCounter++;
        Task storage newTask = tasks[taskId];
        newTask.creator = msg.sender;
        newTask.assignedAgent = _agentAddress;
        newTask.taskType = _taskType;
        newTask.taskData = _taskData;
        newTask.payment = _payment;
        newTask.status = TaskStatus.Assigned;

        emit TaskCreated(taskId, msg.sender, _taskType);
        emit TaskAssigned(taskId, _agentAddress);
    }

    modifier onlyUpgrader() {
        require(owner == msg.sender, "Unauthorized Access");
        _;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyUpgrader
        override
    {}
}