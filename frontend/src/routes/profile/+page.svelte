<script lang="ts">
  import { JsonRpcProvider } from "ethers";
  import { wallet } from "$lib/web3/wallet.svelte";
  import { robotCredits, robotMarketplace } from "$lib/web3/contracts";
  import { DEFAULT_NETWORK } from "$lib/web3/networks";
  import { fmtRcred, shortAddress } from "$lib/format";

  let balance = $state<bigint | null>(null);
  let owned = $state<bigint[]>([]);
  let error = $state<string | null>(null);
  let loading = $state(false);

  // Reads go through a plain JsonRpcProvider instead of MetaMask's
  // BrowserProvider: MetaMask sometimes wraps view-call responses in a
  // "missing revert data" error (it intercepts eth_call and may swallow
  // the actual return data for dynamic-array returns like uint256[]).
  // The signer (wallet.provider) is only needed for writes.
  function readRunner(chainId: number): JsonRpcProvider {
    const rpcUrl = wallet.network?.rpcUrl ?? DEFAULT_NETWORK.rpcUrl;
    return new JsonRpcProvider(rpcUrl, chainId);
  }

  async function load() {
    if (!wallet.isConnected || !wallet.account || !wallet.chainId) return;
    loading = true;
    error = null;
    try {
      const runner = readRunner(wallet.chainId);
      const rcred = robotCredits(runner, wallet.chainId);
      const mkt = robotMarketplace(runner, wallet.chainId);
      balance = await rcred.balanceOf(wallet.account);
      owned = await mkt.tokensOfOwner(wallet.account);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (wallet.account && wallet.chainId) load();
  });

  // Live: refresh whenever an event touches our address.
  $effect(() => {
    if (!wallet.account || !wallet.chainId) return;
    const runner = readRunner(wallet.chainId);
    const rcred = robotCredits(runner, wallet.chainId);
    const mkt = robotMarketplace(runner, wallet.chainId);
    const reload = () => load();
    rcred.on("Transfer", reload);
    mkt.on("RobotPurchased", reload);
    mkt.on("RobotMinted", reload);
    return () => {
      rcred.removeAllListeners();
      mkt.removeAllListeners();
      runner.destroy();
    };
  });
</script>

<h1 class="text-2xl font-bold text-mcast-blue">Profile</h1>

{#if !wallet.isConnected}
  <p class="mt-4">Connect MetaMask to see your RCRED balance and Robots.</p>
{:else}
  <div class="card mt-4 space-y-2">
    <p><span class="font-semibold">Account:</span> <span class="font-mono">{shortAddress(wallet.account)}</span></p>
    <p>
      <span class="font-semibold">RCRED balance:</span>
      <span class="font-mono text-mcast-accent">{balance == null ? "..." : fmtRcred(balance)}</span>
    </p>
  </div>

  <h2 class="mt-6 text-lg font-semibold text-mcast-blue">Your Robots</h2>
  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <div class="card mt-2 border border-red-300 text-red-800">{error}</div>
  {:else if owned.length === 0}
    <p class="text-sm text-mcast-dark/70">You don't own any Robots yet.</p>
  {:else}
    <ul class="mt-2 grid gap-2 sm:grid-cols-2">
      {#each owned as id (id)}
        <li><a class="card block hover:shadow-md" href={`/robot/${id}`}>Robot #{id}</a></li>
      {/each}
    </ul>
  {/if}
{/if}
