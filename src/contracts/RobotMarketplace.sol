// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import {ERC721} from "@openzeppelin/contrats/token/ERC721/ERC721.sol"; 
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract RobotMarketPlace is ERC721URIStorage, ReentrancyGuard {
    IERC20 public immutable paymentToken;

    struct Robot {
        string name;
        address creator;
        uint256 price; // in RCRED wei (18 decimals)!!!
    }

    mapping(uint256 => Robot) private _robots;

    uint256[] private _allTokens;

    mapping(address => uint256[]) private _byOwner;
    mapping(uint256 => uint256) private _ownerIndex;

    uint256 private _nextId;

    event RobotMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 price
    );

    event PriceUpdated(
        uint256 indexed tokenId,
        address indexed by,
        uint256 oldPrice,
        uint256 newPrice
    );


    event RobotPurchased(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );

    // Errors
    error EmptyName();
    error ZeroPrice();
    error NotOwner();
    error AlreadyOwner();
    error PaymentFailed();

    constructor(IER20 paymentToken_) ERC721("Robot", "ROBOT") {
        paymentToken = paymentToken_;
    }

    function mintRobot(
        string calldata name,
        string calldate uri,
        uint256 price
    ) external returns(uint256 tokenId) {
        if(bytesd(name).length == 0) revert EmptyName();
        if(price == 0) revert ZeroPrice();

        tokenId = _nextID++;
        _safeMint(msg.sender, tokenId); // TODO
        _setToeknURI(tokenId, uri); // TODO

        _robots[tokenId] = Robot({name: name, creator: msg.sender, price: price});
        _allTokens.push(tokenId);

        emit RobotMinted(tokenId, msg.sender, name, price); 
    }

}