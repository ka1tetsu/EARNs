// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title JPYC - Japan Yen Compatible Token
 * @dev ERC-20 トークン実装（ポイント＆リワード用）
 */
contract JPYC is ERC20, ERC20Burnable, Ownable, Pausable {
    // ==========================================
    // 状態変数
    // ==========================================

    // Relayer アドレス（バックエンドがここから送金）
    address public relayerAddress;

    // ユーザーごとの累積報酬額
    mapping(address => uint256) public totalEarned;

    // ユーザーごとの交換履歴
    mapping(address => ExchangeRecord[]) public exchangeHistory;

    // 管理者アドレス
    address[] public admins;

    // ==========================================
    // イベント
    // ==========================================

    event RewardGiven(address indexed user, uint256 amount, string reason);
    event TokensExchanged(address indexed user, uint256 amount, string reference);
    event RelayerChanged(address indexed oldRelayer, address indexed newRelayer);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    // ==========================================
    // 構造体
    // ==========================================

    struct ExchangeRecord {
        uint256 amount;
        uint256 timestamp;
        string reference;
    }

    // ==========================================
    // 修飾子
    // ==========================================

    modifier onlyAdmin() {
        require(
            msg.sender == owner() || isAdmin(msg.sender),
            "JPYC: Only admin can call this function"
        );
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayerAddress, "JPYC: Only relayer can call this function");
        _;
    }

    // ==========================================
    // コンストラクタ
    // ==========================================

    constructor(uint256 initialSupply) ERC20("JPYC Token", "JPYC") {
        // 初期供給量を展開者に付与（Wei: 10^18 = 1 JPYC）
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    // ==========================================
    // 管理者機能
    // ==========================================

    /**
     * Relayer アドレスを設定
     * バックエンドサーバーのアドレスをここに設定します
     */
    function setRelayerAddress(address _relayer) external onlyOwner {
        require(_relayer != address(0), "JPYC: Invalid address");
        address oldRelayer = relayerAddress;
        relayerAddress = _relayer;
        emit RelayerChanged(oldRelayer, _relayer);
    }

    /**
     * 管理者を追加
     */
    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "JPYC: Invalid address");
        require(!isAdmin(_admin), "JPYC: Already an admin");
        admins.push(_admin);
        emit AdminAdded(_admin);
    }

    /**
     * 管理者を削除
     */
    function removeAdmin(address _admin) external onlyOwner {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                emit AdminRemoved(_admin);
                break;
            }
        }
    }

    /**
     * 管理者か確認
     */
    function isAdmin(address _admin) public view returns (bool) {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                return true;
            }
        }
        return false;
    }

    // ==========================================
    // ユーザー報酬機能
    // ==========================================

    /**
     * ユーザーにリワードを付与（ポイント獲得）
     * @param _user リワード対象のユーザーアドレス
     * @param _amount リワード額（JPYC 単位）
     * @param _reason リワード理由（例: "ad-view", "task-complete"）
     */
    function giveReward(
        address _user,
        uint256 _amount,
        string memory _reason
    ) external onlyAdmin {
        require(_user != address(0), "JPYC: Invalid user address");
        require(_amount > 0, "JPYC: Amount must be greater than 0");

        // Wei に変換
        uint256 amountInWei = _amount * 10 ** decimals();

        // 報酬を付与（新規トークンをミント）
        _mint(_user, amountInWei);

        // 累積報酬を記録
        totalEarned[_user] += _amount;

        emit RewardGiven(_user, _amount, _reason);
    }

    /**
     * 複数ユーザーへの一括リワード付与
     */
    function giveRewardBatch(
        address[] memory _users,
        uint256[] memory _amounts,
        string memory _reason
    ) external onlyAdmin {
        require(_users.length == _amounts.length, "JPYC: Array length mismatch");

        for (uint256 i = 0; i < _users.length; i++) {
            giveReward(_users[i], _amounts[i], _reason);
        }
    }

    // ==========================================
    // トークン交換機能
    // ==========================================

    /**
     * ユーザーが保有トークンを交換（バーン）
     * @param _amount 交換額（JPYC 単位）
     * @param _reference 参照ID（交換IDなど）
     */
    function exchangeTokens(uint256 _amount, string memory _reference) external {
        require(_amount >= 10, "JPYC: Minimum exchange amount is 10");
        require(_amount % 10 == 0, "JPYC: Must be multiple of 10");

        uint256 amountInWei = _amount * 10 ** decimals();
        require(balanceOf(msg.sender) >= amountInWei, "JPYC: Insufficient balance");

        // トークンをバーン（焼却）
        _burn(msg.sender, amountInWei);

        // 交換履歴を記録
        exchangeHistory[msg.sender].push(
            ExchangeRecord({
                amount: _amount,
                timestamp: block.timestamp,
                reference: _reference
            })
        );

        emit TokensExchanged(msg.sender, _amount, _reference);
    }

    /**
     * ユーザーの交換履歴を取得
     */
    function getExchangeHistory(address _user) 
        external 
        view 
        returns (ExchangeRecord[] memory) 
    {
        return exchangeHistory[_user];
    }

    /**
     * ユーザーの交換回数を取得
     */
    function getExchangeCount(address _user) external view returns (uint256) {
        return exchangeHistory[_user].length;
    }

    // ==========================================
    // Relayer 送金機能（バックエンドから呼び出し）
    // ==========================================

    /**
     * Relayer から直接送金（ガス代を バックエンドが負担）
     * @param _to 受取人アドレス
     * @param _amount 送金額（JPYC 単位）
     */
    function transferByRelayer(address _to, uint256 _amount) 
        external 
        onlyRelayer 
        returns (bool) 
    {
        require(_to != address(0), "JPYC: Invalid recipient address");
        require(_amount > 0, "JPYC: Amount must be greater than 0");

        uint256 amountInWei = _amount * 10 ** decimals();
        return transfer(_to, amountInWei);
    }

    // ==========================================
    // 標準 ERC-20 オーバーライド
    // ==========================================

    /**
     * Pausable 対応（緊急時の取引停止）
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * 取引を一時停止（管理者のみ）
     */
    function pause() public onlyAdmin {
        _pause();
    }

    /**
     * 取引を再開（管理者のみ）
     */
    function unpause() public onlyAdmin {
        _unpause();
    }

    // ==========================================
    // ユーティリティ関数
    // ==========================================

    /**
     * コントラクト残高を確認
     */
    function getContractBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }

    /**
     * ユーザーの累積報酬を確認
     */
    function getUserTotalEarned(address _user) external view returns (uint256) {
        return totalEarned[_user];
    }

    /**
     * トークンを回収（緊急用）
     */
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(_amount <= balanceOf(address(this)), "JPYC: Insufficient balance");
        transfer(owner(), _amount);
    }

    /**
     * Ether を回収（緊急用）
     */
    function withdrawEther() external onlyOwner {
        (bool success, ) = payable(owner()).call{ value: address(this).balance }("");
        require(success, "JPYC: Withdrawal failed");
    }

    /**
     * Ether 受け取り（フォールバック）
     */
    receive() external payable {}
}
