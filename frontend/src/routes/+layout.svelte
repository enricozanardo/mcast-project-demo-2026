<script lang="ts">
  import "../app.css";
  import ConnectButton from "$lib/components/ConnectButton.svelte";

  interface Props {
    children?: import("svelte").Snippet;
  }
  let { children }: Props = $props();
</script>

<header class="border-b border-mcast-blue/20 bg-white">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
    <a href="/" class="flex items-center gap-2">
      <img src="/favicon.svg" alt="" class="h-7 w-7" />
      <span class="text-lg font-semibold text-mcast-blue">Robot Marketplace</span>
    </a>
    <nav class="flex items-center gap-4 text-sm">
      <a href="/" class="text-mcast-blue hover:underline">Marketplace</a>
      <!-- TODO: add /profile and ConnectButton  -->
      <ConnectButton />
    </nav>
  </div>
</header>

<main class="mx-auto max-w-5xl px-4 py-6">
  {@render children?.()}
</main>

<footer class="mx-auto max-w-5xl px-4 py-6 text-xs text-mcast-blue/60">
  MCAST Web3 -- Robot Marketplace 
</footer>
