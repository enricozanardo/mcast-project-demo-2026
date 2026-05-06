// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		ethereum?: import("ethers").Eip1193Provider & {
			on?: (event: string, handler: (...args: unknown[]) => void) => void;
			removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
		}
	}
}



export {};
