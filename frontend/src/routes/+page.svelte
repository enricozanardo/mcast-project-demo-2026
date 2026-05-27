<script lang="ts">
  import { onMount } from "svelte";
  import { wallet } from "$lib/web3/wallet.svelte";
  import { robotMarketplace } from "$lib/web3/contracts";
  import { fmtRcred, shortAddress } from "$lib/format";
  import { DEFAULT_NETWORK } from "$lib/web3/networks";
  import BuyTokensPanel from "$lib/components/BuyTokensPanel.svelte";

  interface RobotRow {
    id: bigint;
    name: string;
    creator: string;
    owner: string;
    price: bigint;
    uri: string;
  }

  let robots = $state<RobotRow[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load() {
    loading = true;
    error = null;
    try {
      const { JsonRpcProvider } = await import("ethers");
      const runner = wallet.provider ?? new JsonRpcProvider(DEFAULT_NETWORK.rpcUrl);
      const chainId = wallet.chainId ?? DEFAULT_NETWORK.chainId;

      const mkt = robotMarketplace(runner, chainId);
      const total: bigint = await mkt.totalRobots();
      const out: RobotRow[] = [];
      for (let i = 0n; i < total; i++) {
        const r = await mkt.getRobot(i);
        out.push({
          id: i,
          name: r.name,
          creator: r.creator,
          owner: r.owner,
          price: r.price,
          uri: r.uri,
        });
      }
      robots = out;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(load);
  $effect(() => {
    // Re-load when the user connects or switches network.
    if (wallet.chainId) load();
  });
</script>

<section class="mb-6">
  <h1 class="text-2xl font-bold text-mcast-blue">Robots for sale</h1>
  <p class="text-sm text-mcast-dark/70">
    ERC-721 marketplace paid in RCRED. Need credits? Buy some on the right.
  </p>
</section>

<div class="mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
  <p class="text-sm text-mcast-dark/70 self-end">
    {#if !wallet.isConnected}
      Connect MetaMask to buy RCRED or own a Robot.
    {:else}
      Connected as <span class="font-mono">{shortAddress(wallet.account)}</span>.
      Want to create your own?
      <a href="/mint" class="text-mcast-blue underline">Mint a Robot</a>.
    {/if}
  </p>
  <BuyTokensPanel onPurchased={load} />
</div>

{#if loading}
  <p class="text-mcast-blue">Loading...</p>
{:else if error}
  <div class="card border border-red-300 text-red-800">
    <strong>Could not read marketplace:</strong> {error}
    <p class="mt-2 text-xs">
      Did you start <code>npx hardhat node</code>, run the deploy script,
      and then <code>npx hardhat run scripts/export-abi.ts</code>?
    </p>
  </div>
{:else if robots.length === 0}
  <p>No robots minted yet.</p>
{:else}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each robots as r (r.id)}
      <a href={`/robot/${r.id}`} class="card transition hover:shadow-md">
        <img src={r.uri} alt={r.name} class="mb-3 h-40 w-full rounded bg-mcast-blue object-contain" />
        <div class="flex items-baseline justify-between">
          <h2 class="font-semibold">{r.name}</h2>
          <span class="text-mcast-accent font-mono">{fmtRcred(r.price)} RCRED</span>
        </div>
        <p class="mt-1 text-xs text-mcast-dark/70">
          Owner: <span class="font-mono">{shortAddress(r.owner)}</span>
        </p>
      </a>
    {/each}
  </div>
{/if}
