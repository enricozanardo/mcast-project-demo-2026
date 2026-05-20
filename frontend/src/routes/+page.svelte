<script lang="ts">
    import {onMount} from "svelte";
    import { wallet } from "$lib/web3/wallet.svelte";
    import { DEFAULT_NETWORK } from "$lib/web3/networks";
    import { robotMarketplace } from "$lib/web3/contracts";
    import { fmtRcred, shortAddress } from "$lib/format";
    import BuyTokensPanel from "$lib/components/BuyTokensPanel.svelte";
  
    interface RobotRow {
        id: bigint;
        name: string;
        creator: string
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

        } catch (e) {
            error = (e as Error).message;
        } finally {
            loading = false;
        }
    }

    // TODO: use effect to call load!! 
    onMount(load);
    $effect(() => {
        if (wallet.chainId) load();
    });

</script>

<section class="mb-6">
  <h1 class="text-2xl font-bold text-mcast-blue">Robots for sale</h1>
  <p class="text-sm text-mcast-dark/70">
    ERC-721 marketplace paid in RCRED. Need credits? Buy some on the right.
  </p>
</section>

{#if loading}
    <p class="text-mcast-blue" >loading...</p>
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
    <div class="grid grid-col-1 gap-4 sm:grid-cols-2 lg:grid-col-3">
        bla bla bla ...
    </div>
{/if}