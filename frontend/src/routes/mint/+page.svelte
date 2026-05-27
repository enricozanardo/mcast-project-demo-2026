<script lang="ts">
  import { goto } from "$app/navigation";
  import { toWei } from "$lib/format";
  import { wallet } from "$lib/web3/wallet.svelte";
  import { robotMarketplace } from "$lib/web3/contracts";
  import {
    mapTxError,
    sendTx,
    waitReceipt,
    findEvent,
    type TxStatus as Status,
  } from "$lib/web3/tx";
  import { robotSvg, ACCENT_PALETTE } from "$lib/svg";
  import TxStatus from "$lib/components/TxStatus.svelte";

  let name = $state("RX-9");
  let accent = $state(ACCENT_PALETTE[0]);
  let priceRcred = $state("10");

  let status = $state<Status>("idle");
  let txHash = $state<string | null>(null);
  let error = $state<string | null>(null);

  let preview = $derived(robotSvg({ name: name || "?", accent }));
  let canSubmit = $derived(
    wallet.isConnected &&
      name.trim().length > 0 &&
      Number(priceRcred) > 0 &&
      status !== "sending" &&
      status !== "mining",
  );

  async function mint() {
    if (!wallet.signer || !wallet.provider || !wallet.chainId) return;
    error = null;
    txHash = null;
    status = "sending";
    try {
      const mkt = robotMarketplace(wallet.signer, wallet.chainId);
      const wei = toWei(priceRcred);
      const hash = await sendTx(mkt, "mintRobot", [name.trim(), preview, wei]);
      txHash = hash;
      status = "mining";
      const receipt = await waitReceipt(wallet.provider, hash);
      status = "success";

      // Find the new token id from the RobotMinted event so we can jump
      // straight to its detail page.
      const evt = findEvent(mkt.interface, receipt, "RobotMinted");
      const newId = evt?.args?.tokenId as bigint | undefined;
      if (newId !== undefined) {
        setTimeout(() => goto(`/robot/${newId}`), 800);
      }
    } catch (e) {
      error = mapTxError(e);
      status = "error";
    }
  }
</script>

<h1 class="text-2xl font-bold text-mcast-blue">Mint a new Robot</h1>
<p class="mt-1 text-sm text-mcast-dark/70">
  Pick a name, an accent colour, and a starting price (in RCRED).
  Anyone can mint -- the marketplace stores the SVG fully on-chain.
</p>

{#if !wallet.isConnected}
  <div class="card mt-4">
    Connect MetaMask first.
  </div>
{:else}
  <div class="mt-4 grid gap-6 md:grid-cols-2">
    <div class="card space-y-3">
      <label class="block">
        <span class="text-sm font-semibold">Name</span>
        <input
          class="mt-1 w-full rounded border px-2 py-1"
          maxlength="12"
          bind:value={name}
        />
      </label>

      <fieldset>
        <legend class="text-sm font-semibold">Accent</legend>
        <div class="mt-1 flex gap-2">
          {#each ACCENT_PALETTE as color (color)}
            <button
              type="button"
              class="h-8 w-8 rounded border"
              class:ring-2={accent === color}
              style="background:{color}"
              aria-label={color}
              onclick={() => (accent = color)}
            ></button>
          {/each}
        </div>
      </fieldset>

      <label class="block">
        <span class="text-sm font-semibold">Initial price (RCRED)</span>
        <input
          type="number"
          step="1"
          min="1"
          class="mt-1 w-full rounded border px-2 py-1"
          bind:value={priceRcred}
        />
      </label>

      <button
        class="w-full rounded bg-mcast-accent px-3 py-2 text-white disabled:opacity-50"
        onclick={mint}
        disabled={!canSubmit}
      >
        Mint Robot
      </button>

      <TxStatus {status} {txHash} {error} successMessage="Robot minted! Redirecting..." />
    </div>

    <div class="card">
      <p class="mb-2 text-sm font-semibold">Live preview</p>
      <img src={preview} alt="preview" class="w-full rounded bg-mcast-blue" />
    </div>
  </div>
{/if}
