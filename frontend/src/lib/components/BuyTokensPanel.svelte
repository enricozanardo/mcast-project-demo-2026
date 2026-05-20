<script lang="ts">
  import { fmtRcred, toWei } from "$lib/format";
  import { wallet } from "$lib/web3/wallet.svelte";
  import { tokenSale } from "$lib/web3/contracts";
  import { mapTxError, sendTx, waitReceipt, type TxStatus as Status } from "$lib/web3/tx";
  import TxStatus from "./TxStatus.svelte";

  let { onPurchased }: { onPurchased?: () => void } = $props();

  let ethAmount = $state("0.1");
  let rate = $state<bigint | null>(null);
  let status = $state<Status>("idle");
  let txHash = $state<string | null>(null);
  let error = $state<string | null>(null);

  let expectedRcredWei = $derived.by(() => {
    if (rate == null) return null;
    try {
      const wei = toWei(ethAmount);
      return wei * rate;
    } catch {
      return null;
    }
  });

  async function loadRate() {
    if (!wallet.provider || !wallet.chainId) return;
    try {
      const sale = tokenSale(wallet.provider, wallet.chainId);
      rate = await sale.tokensPerEth();
    } catch (e) {
      rate = null;
      error = (e as Error).message;
    }
  }

  $effect(() => {
    if (wallet.chainId) loadRate();
  });

  async function buy() {
    if (!wallet.signer || !wallet.provider || !wallet.chainId) return;
    error = null;
    txHash = null;
    status = "sending";
    try {
      const sale = tokenSale(wallet.signer, wallet.chainId);
      const value = toWei(ethAmount);
      const hash = await sendTx(sale, "buyTokens", [], { value });
      txHash = hash;
      status = "mining";
      await waitReceipt(wallet.provider, hash);
      status = "success";
      onPurchased?.();
    } catch (e) {
      error = mapTxError(e);
      status = "error";
    }
  }
</script>

<div class="card">
  <h3 class="font-semibold text-mcast-blue">Buy RCRED</h3>
  <p class="text-xs text-mcast-dark/70">
    Send ETH to <code>TokenSale</code> and receive RCRED at the current rate.
  </p>

  <div class="mt-3 flex gap-2">
    <input
      type="number"
      step="0.01"
      min="0"
      bind:value={ethAmount}
      class="w-32 rounded border px-2 py-1"
      disabled={status === "sending" || status === "mining"}
    />
    <span class="self-center">ETH</span>
    <button
      class="ml-auto rounded bg-mcast-blue px-3 py-1 text-white disabled:opacity-50"
      onclick={buy}
      disabled={!wallet.isConnected || status === "sending" || status === "mining"}
    >
      Buy
    </button>
  </div>

  <p class="mt-2 text-xs text-mcast-dark/70">
    Rate: {rate == null ? "..." : `1 ETH = ${rate} RCRED`} —
    expected: <span class="font-mono text-mcast-accent">
      {expectedRcredWei == null ? "?" : fmtRcred(expectedRcredWei)}
    </span> RCRED
  </p>

  <TxStatus {status} {txHash} {error} successMessage="RCRED received." />
</div>
