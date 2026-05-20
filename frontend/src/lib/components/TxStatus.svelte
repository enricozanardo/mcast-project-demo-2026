<script lang="ts">
  import { wallet } from "$lib/web3/wallet.svelte";
  import { explorerTx, type TxStatus as TxStatusKind } from "$lib/web3/tx";

  interface Props {
    status: TxStatusKind;
    txHash?: string | null;
    error?: string | null;
    successMessage?: string;
  }
  let { status, txHash = null, error = null, successMessage = "Transaction confirmed." }: Props = $props();

  let url = $derived(explorerTx(wallet.chainId, txHash ?? null));
</script>

{#if status === "sending"}
  <p class="mt-2 text-sm text-mcast-blue">Waiting for MetaMask...</p>
{:else if status === "mining"}
  <p class="mt-2 text-sm text-mcast-blue">
    Mining...
    {#if txHash}
      <span class="font-mono">{txHash.slice(0, 10)}...</span>
      {#if url}
        <a href={url} class="ml-1 underline" target="_blank" rel="noopener">view on explorer</a>
      {/if}
    {/if}
  </p>
{:else if status === "success"}
  <p class="mt-2 text-sm text-green-700">
    {successMessage}
    {#if url}
      <a href={url} class="ml-1 underline" target="_blank" rel="noopener">view tx</a>
    {/if}
  </p>
{:else if status === "error" && error}
  <p class="mt-2 text-sm text-red-700">{error}</p>
{/if}
