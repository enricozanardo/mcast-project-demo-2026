// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract RobotMarketplace is ERC721URIStorage, ReentrancyGuard {
    /// @notice Payment token (RCRED in our deployment).
    IERC20 public immutable paymentToken;

    /// @notice Per-Robot data the UI surfaces in the listing grid.
    struct Robot {
        string name;
        address creator;
        uint256 price; // in RCRED wei (18 decimals)
    }

    /// @dev tokenId -> data
    mapping(uint256 => Robot) private _robots;

    /// @dev Append-only list of minted token IDs (used by `totalRobots()`).
    uint256[] private _allTokens;

    /// @dev owner -> tokenIds (kept in sync on every transfer).
    mapping(address => uint256[]) private _byOwner;
    /// @dev tokenId -> index inside `_byOwner[owner]` for O(1) removal.
    mapping(uint256 => uint256) private _ownerIndex;

    /// @dev Monotonic id source.
    uint256 private _nextId;

    // ------------------------------------------------------------------
    // Events -- the "history" the UI will reconstruct.
    // ------------------------------------------------------------------

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

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------

    error EmptyName();
    error ZeroPrice();
    error NotOwner();
    error AlreadyOwner();
    error PaymentFailed();

    constructor(IERC20 paymentToken_)
        ERC721("Robot", "ROBOT")
    {
        paymentToken = paymentToken_;
    }

    // ------------------------------------------------------------------
    // Mutating API
    // ------------------------------------------------------------------

    /// @notice Mint a new Robot to the caller.
    /// @param  name     Human-readable name.
    /// @param  uri      Token URI -- typically `data:image/svg+xml;base64,...`.
    /// @param  price    Initial price in RCRED (wei, 18 decimals).
    /// @return tokenId  The id of the freshly minted Robot.
    function mintRobot(
        string calldata name,
        string calldata uri,
        uint256 price
    ) external returns (uint256 tokenId) {
        if (bytes(name).length == 0) revert EmptyName();
        if (price == 0) revert ZeroPrice();

        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        _robots[tokenId] = Robot({name: name, creator: msg.sender, price: price});
        _allTokens.push(tokenId);

        emit RobotMinted(tokenId, msg.sender, name, price);
    }

    /// @notice Update the price of a Robot. Only the *current* owner can do this.
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        if (newPrice == 0) revert ZeroPrice();
        if (ownerOf(tokenId) != msg.sender) revert NotOwner();

        uint256 oldPrice = _robots[tokenId].price;
        _robots[tokenId].price = newPrice;

        emit PriceUpdated(tokenId, msg.sender, oldPrice, newPrice);
    }

    /// @notice Buy a Robot, paying its current price in RCRED.
    /// @dev    The buyer must have called `paymentToken.approve(marketplace, price)`
    ///         first. Follows checks-effects-interactions and uses `nonReentrant`.
    function buyRobot(uint256 tokenId) external nonReentrant {
        address seller = ownerOf(tokenId);
        if (seller == msg.sender) revert AlreadyOwner();

        uint256 price = _robots[tokenId].price;

        // Effects: transfer the NFT first so re-entrancy can't double-spend.
        _safeTransfer(seller, msg.sender, tokenId);

        // Interactions: pull RCRED from buyer to seller.
        bool ok = paymentToken.transferFrom(msg.sender, seller, price);
        if (!ok) revert PaymentFailed();

        emit RobotPurchased(tokenId, seller, msg.sender, price);
    }

    // ------------------------------------------------------------------
    // Views the front-end uses
    // ------------------------------------------------------------------

    function totalRobots() external view returns (uint256) {
        return _allTokens.length;
    }

    function tokenIdAt(uint256 index) external view returns (uint256) {
        return _allTokens[index];
    }

    function getRobot(uint256 tokenId)
        external
        view
        returns (
            string memory name,
            address creator,
            address owner,
            uint256 price,
            string memory uri
        )
    {
        Robot storage r = _robots[tokenId];
        return (r.name, r.creator, ownerOf(tokenId), r.price, tokenURI(tokenId));
    }

    function tokensOfOwner(address account)
        external
        view
        returns (uint256[] memory)
    {
        return _byOwner[account];
    }

    // ------------------------------------------------------------------
    // Owner-tracking hooks (OZ v5: override `_update`)
    // ------------------------------------------------------------------

    /// @dev Hook OpenZeppelin v5 calls on every mint/transfer/burn. We use
    ///      it to keep the per-owner index in sync, which lets us serve
    ///      `tokensOfOwner` in O(1) instead of scanning all tokens.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        address result = super._update(to, tokenId, auth);

        if (from != address(0)) {
            _removeFromOwnerIndex(from, tokenId);
        }
        if (to != address(0)) {
            _addToOwnerIndex(to, tokenId);
        }
        return result;
    }

    function _addToOwnerIndex(address account, uint256 tokenId) private {
        _ownerIndex[tokenId] = _byOwner[account].length;
        _byOwner[account].push(tokenId);
    }

    function _removeFromOwnerIndex(address account, uint256 tokenId) private {
        uint256 last = _byOwner[account].length - 1;
        uint256 idx = _ownerIndex[tokenId];
        if (idx != last) {
            uint256 lastId = _byOwner[account][last];
            _byOwner[account][idx] = lastId;
            _ownerIndex[lastId] = idx;
        }
        _byOwner[account].pop();
        delete _ownerIndex[tokenId];
    }
}
