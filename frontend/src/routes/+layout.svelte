<script lang="ts">
  import "../app.css";
 
  interface Props {
    children?: import("svelte").Snippet;
  }
  let { children }: Props = $props();
</script>


<header>
	<div>
		<span class="text-lg font-semibold text-mcast-blue">Robot Marketplace</span>
	</div>
</header>

<main class="mx-auto max-w-5xl px-4 py-6">
	{@render children?.()}
</main>

<footer class="mx-auto max-w-5xl px-4 py-6 text-xs text-mcast-blue/60">
	MCAST web3 2026
</footer>
