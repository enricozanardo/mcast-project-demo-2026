<script lang="ts">
  import { wallet } from "$lib/web3/wallet.svelte";
  import { shortAddress } from "$lib/format";
  import { DEFAULT_NETWORK } from "$lib/web3/networks";
</script>

{#if !wallet.isConnected}
  <button
    class="btn-primary"
    disabled={wallet.connecting}
    onclick={() => wallet.connect()}
  >
    {wallet.connecting ? "Connecting..." : "Connect MetaMask"}
  </button>
{:else if wallet.wrongNetwork}
  <button class="btn-secondary" onclick={() => wallet.switchTo(DEFAULT_NETWORK.chainId)}>
    Switch to {DEFAULT_NETWORK.name}
  </button>
{:else}
  <div class="flex items-center gap-3">
    <span class="text-xs text-mcast-blue">{wallet.network?.name}</span>
    <span class="font-mono text-sm">{shortAddress(wallet.account)}</span>
    <button class="btn-secondary" onclick={() => wallet.disconnect()}>
      Disconnect
    </button>
  </div>
{/if}

{#if wallet.error}
  <p class="mt-2 text-xs text-red-700">{wallet.error}</p>
{/if}
