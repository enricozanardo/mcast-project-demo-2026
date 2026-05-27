<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import type { Contract } from "ethers";
  import { wallet } from "$lib/web3/wallet.svelte";
  import { robotMarketplace } from "$lib/web3/contracts";
  import { fmtRcred, shortAddress } from "$lib/format";
  import { DEFAULT_NETWORK } from "$lib/web3/networks";
  import { buildHistory, asHistoryLogs, type HistoryEntry } from "$lib/history";
  import HistoryTable from "$lib/components/HistoryTable.svelte";
  import BuyRobotPanel from "$lib/components/BuyRobotPanel.svelte";
  import UpdatePricePanel from "$lib/components/UpdatePricePanel.svelte";

  let id = $derived<bigint>(BigInt($page.params.id ?? "0"));
  let robot = $state<{
    name: string;
    creator: string;
    owner: string;
    price: bigint;
    uri: string;
  } | null>(null);
  let history = $state<HistoryEntry[]>([]);
  let error = $state<string | null>(null);
  let loading = $state(true);

  async function load() {
    loading = true;
    error = null;
    try {
      const { JsonRpcProvider } = await import("ethers");
      const runner = wallet.provider ?? new JsonRpcProvider(DEFAULT_NETWORK.rpcUrl);
      const chainId = wallet.chainId ?? DEFAULT_NETWORK.chainId;
      const mkt = robotMarketplace(runner, chainId);

      const r = await mkt.getRobot(id);
      robot = {
        name: r.name,
        creator: r.creator,
        owner: r.owner,
        price: r.price,
        uri: r.uri,
      };

      const minted = await mkt.queryFilter(mkt.filters.RobotMinted(id));
      const updates = await mkt.queryFilter(mkt.filters.PriceUpdated(id));
      const sales = await mkt.queryFilter(mkt.filters.RobotPurchased(id));
      history = buildHistory(asHistoryLogs(minted), asHistoryLogs(updates), asHistoryLogs(sales));
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(load);
  $effect(() => {
    if (wallet.chainId) load();
  });

  $effect(() => {
    if (!wallet.provider || !wallet.chainId) return;

    const mkt = robotMarketplace(wallet.provider, wallet.chainId);
    const onPriceUpdated = (evtId: bigint) => {
      if (evtId === id) load();
    };
    const onPurchased = (evtId: bigint) => {
      if (evtId === id) load();
    };
    mkt.on("PriceUpdated", onPriceUpdated);
    mkt.on("RobotPurchased", onPurchased);

    return () => {
      mkt.off("PriceUpdated", onPriceUpdated);
      mkt.off("RobotPurchased", onPurchased);
      // Tell ethers to drop the polling timer too:
      (mkt as Contract).removeAllListeners();
    };
  });
</script>

<a href="/" class="text-sm text-mcast-blue hover:underline">&larr; back to marketplace</a>

{#if loading}
  <p class="mt-4 text-mcast-blue">Loading...</p>
{:else if error}
  <div class="card mt-4 border border-red-300 text-red-800">
    {error}
  </div>
{:else if robot}
  <div class="mt-4 grid gap-6 sm:grid-cols-2">
    <img src={robot.uri} alt={robot.name} class="w-full rounded bg-mcast-blue" />
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-bold text-mcast-blue">{robot.name}</h1>
        <dl class="mt-3 space-y-1 text-sm">
          <div><dt class="inline font-semibold">Token id:</dt> <dd class="inline font-mono">{id}</dd></div>
          <div><dt class="inline font-semibold">Creator:</dt> <dd class="inline font-mono">{shortAddress(robot.creator)}</dd></div>
          <div><dt class="inline font-semibold">Current owner:</dt> <dd class="inline font-mono">{shortAddress(robot.owner)}</dd></div>
          <div><dt class="inline font-semibold">Price:</dt> <dd class="inline text-mcast-accent">{fmtRcred(robot.price)} RCRED</dd></div>
        </dl>
      </div>

      <BuyRobotPanel
        tokenId={id}
        price={robot.price}
        owner={robot.owner}
        onBought={load}
      />

      <UpdatePricePanel
        tokenId={id}
        currentPrice={robot.price}
        owner={robot.owner}
        onUpdated={load}
      />
    </div>
  </div>

  <section class="mt-8">
    <h2 class="mb-2 text-lg font-semibold text-mcast-blue">History</h2>
    <div class="card">
      <HistoryTable entries={history} />
    </div>
  </section>
{/if}
