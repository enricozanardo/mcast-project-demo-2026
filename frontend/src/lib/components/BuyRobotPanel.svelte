<script lang="ts">
  import { wallet } from "$lib/web3/wallet.svelte";
  import { robotCredits, robotMarketplace, addressFor } from "$lib/web3/contracts";
  import { mapTxError, sendTx, waitReceipt, type TxStatus as Status } from "$lib/web3/tx";
  import { fmtRcred } from "$lib/format";
  import TxStatus from "./TxStatus.svelte";

  interface Props {
    tokenId: bigint;
    price: bigint;
    owner: string;
    onBought?: () => void;
  }
  let { tokenId, price, owner, onBought }: Props = $props();

  let allowance = $state<bigint | null>(null);
  let balance = $state<bigint | null>(null);
  let approveStatus = $state<Status>("idle");
  let approveTx = $state<string | null>(null);
  let approveError = $state<string | null>(null);
  let buyStatus = $state<Status>("idle");
  let buyTx = $state<string | null>(null);
  let buyError = $state<string | null>(null);

  let isOwner = $derived(
    !!wallet.account && owner.toLowerCase() === wallet.account.toLowerCase(),
  );
  let hasAllowance = $derived(allowance != null && allowance >= price);
  let hasBalance = $derived(balance != null && balance >= price);

  async function refresh() {
    if (!wallet.provider || !wallet.account || !wallet.chainId) return;
    try {
      const rcred = robotCredits(wallet.provider, wallet.chainId);
      const mktAddr = addressFor(wallet.chainId, "RobotMarketplace");
      [allowance, balance] = await Promise.all([
        rcred.allowance(wallet.account, mktAddr),
        rcred.balanceOf(wallet.account),
      ]);
    } catch {
      allowance = null;
      balance = null;
    }
  }

  $effect(() => {
    if (wallet.account && wallet.chainId) refresh();
  });

  async function approve() {
    if (!wallet.signer || !wallet.provider || !wallet.chainId) return;
    approveError = null;
    approveTx = null;
    approveStatus = "sending";
    try {
      const rcred = robotCredits(wallet.signer, wallet.chainId);
      const mktAddr = addressFor(wallet.chainId, "RobotMarketplace");
      const hash = await sendTx(rcred, "approve", [mktAddr, price]);
      approveTx = hash;
      approveStatus = "mining";
      await waitReceipt(wallet.provider, hash);
      approveStatus = "success";
      await refresh();
    } catch (e) {
      approveError = mapTxError(e);
      approveStatus = "error";
    }
  }

  async function buy() {
    if (!wallet.signer || !wallet.provider || !wallet.chainId) return;
    buyError = null;
    buyTx = null;
    buyStatus = "sending";
    try {
      const mkt = robotMarketplace(wallet.signer, wallet.chainId);
      const hash = await sendTx(mkt, "buyRobot", [tokenId]);
      buyTx = hash;
      buyStatus = "mining";
      await waitReceipt(wallet.provider, hash);
      buyStatus = "success";
      await refresh();
      onBought?.();
    } catch (e) {
      buyError = mapTxError(e);
      buyStatus = "error";
    }
  }
</script>

<div class="card">
  <h3 class="font-semibold text-mcast-blue">Buy this Robot</h3>

  {#if !wallet.isConnected}
    <p class="mt-2 text-sm">Connect MetaMask to buy.</p>
  {:else if isOwner}
    <p class="mt-2 text-sm text-mcast-dark/70">You already own this Robot.</p>
  {:else}
    <p class="mt-1 text-sm">
      Price: <span class="text-mcast-accent">{fmtRcred(price)} RCRED</span> —
      your balance:
      <span class="font-mono">{balance == null ? "..." : fmtRcred(balance)}</span>
    </p>
    <p class="text-xs text-mcast-dark/70">
      Allowance to marketplace:
      <span class="font-mono">{allowance == null ? "..." : fmtRcred(allowance)}</span>
    </p>

    <div class="mt-3 flex gap-2">
      <button
        class="flex-1 rounded bg-mcast-blue px-3 py-1 text-white disabled:opacity-50"
        onclick={approve}
        disabled={hasAllowance ||
          approveStatus === "sending" ||
          approveStatus === "mining"}
      >
        1. Approve
      </button>
      <button
        class="flex-1 rounded bg-mcast-accent px-3 py-1 text-white disabled:opacity-50"
        onclick={buy}
        disabled={!hasAllowance ||
          !hasBalance ||
          buyStatus === "sending" ||
          buyStatus === "mining"}
      >
        2. Buy
      </button>
    </div>

    <TxStatus
      status={approveStatus}
      txHash={approveTx}
      error={approveError}
      successMessage="Allowance set."
    />
    <TxStatus status={buyStatus} txHash={buyTx} error={buyError} successMessage="Robot is yours!" />
  {/if}
</div>
