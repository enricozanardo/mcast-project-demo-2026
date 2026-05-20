<script lang="ts">
  import type { HistoryEntry } from "$lib/history";
  import { shortAddress, fmtRcred } from "$lib/format";

  interface Props {
    entries: HistoryEntry[];
  }
  let { entries }: Props = $props();

  function describe(e: HistoryEntry): string {
    switch (e.kind) {
      case "RobotMinted":
        return `Minted by ${shortAddress(e.args.creator as string)} at ${fmtRcred(
          e.args.price as bigint,
        )} RCRED`;
      case "PriceUpdated":
        return `Price ${fmtRcred(e.args.oldPrice as bigint)} -> ${fmtRcred(
          e.args.newPrice as bigint,
        )} RCRED by ${shortAddress(e.args.by as string)}`;
      case "RobotPurchased":
        return `Sold from ${shortAddress(e.args.from as string)} to ${shortAddress(
          e.args.to as string,
        )} for ${fmtRcred(e.args.price as bigint)} RCRED`;
    }
  }
</script>

<table class="w-full text-left text-sm">
  <thead class="border-b border-mcast-blue/30 text-xs uppercase text-mcast-blue">
    <tr>
      <th class="px-2 py-2">Block</th>
      <th class="px-2 py-2">Event</th>
      <th class="px-2 py-2">Details</th>
    </tr>
  </thead>
  <tbody>
    {#each entries as e (e.txHash + e.kind)}
      <tr class="border-b border-mcast-blue/10">
        <td class="px-2 py-2 font-mono text-xs">{e.blockNumber}</td>
        <td class="px-2 py-2 font-semibold">{e.kind}</td>
        <td class="px-2 py-2">{describe(e)}</td>
      </tr>
    {/each}
    {#if entries.length === 0}
      <tr><td colspan="3" class="px-2 py-4 text-center text-mcast-blue/60">No history yet.</td></tr>
    {/if}
  </tbody>
</table>
