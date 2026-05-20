<script lang="ts">
  import { wallet } from "$lib/web3/wallet.svelte";
  import { robotMarketplace } from "$lib/web3/contracts";
  import { mapTxError, sendTx, waitReceipt, type TxStatus as Status } from "$lib/web3/tx";
  import { fmtRcred, toWei } from "$lib/format";
  import TxStatus from "./TxStatus.svelte";

  interface Props {
    tokenId: bigint;
    currentPrice: bigint;
    owner: string;
    onUpdated?: () => void;
  }
  let { tokenId, currentPrice, owner, onUpdated }: Props = $props();

  let isOwner = $derived(
    !!wallet.account && owner.toLowerCase() === wallet.account.toLowerCase(),
  );

  let newPrice = $state<string>("");
  let status = $state<Status>("idle");
  let txHash = $state<string | null>(null);
  let error = $state<string | null>(null);

  async function update() {
    if (!wallet.signer || !wallet.provider || !wallet.chainId) return;
    error = null;
    txHash = null;
    status = "sending";
    try {
      const mkt = robotMarketplace(wallet.signer, wallet.chainId);
      const wei = toWei(newPrice);
      const hash = await sendTx(mkt, "updatePrice", [tokenId, wei]);
      txHash = hash;
      status = "mining";
      await waitReceipt(wallet.provider, hash);
      status = "success";
      newPrice = "";
      onUpdated?.();
    } catch (e) {
      error = mapTxError(e);
      status = "error";
    }
  }
</script>

{#if isOwner}
  <div class="card">
    <h3 class="font-semibold text-mcast-blue">Update price</h3>
    <p class="text-xs text-mcast-dark/70">
      You are the owner. Current price:
      <span class="font-mono">{fmtRcred(currentPrice)} RCRED</span>
    </p>
    <div class="mt-3 flex gap-2">
      <input
        type="number"
        step="1"
        min="1"
        placeholder="new price (RCRED)"
        bind:value={newPrice}
        class="flex-1 rounded border px-2 py-1"
        disabled={status === "sending" || status === "mining"}
      />
      <button
        class="rounded bg-mcast-blue px-3 py-1 text-white disabled:opacity-50"
        onclick={update}
        disabled={!newPrice || status === "sending" || status === "mining"}
      >
        Update
      </button>
    </div>
    <TxStatus {status} {txHash} {error} successMessage="Price updated." />
  </div>
{/if}
