<script>
	const PASSWORD = "tac";

	let { children } = $props();

	let unlocked = $state(false);
	let input = $state("");
	let error = $state(false);

	function submit(e) {
		e.preventDefault();
		if (input === PASSWORD) {
			unlocked = true;
			error = false;
		} else {
			error = true;
		}
	}
</script>

{#if !unlocked}
	<div class="gate-overlay">
		<form class="gate-box" onsubmit={submit}>
			<p class="gate-label">This site is password protected</p>
			<input
				class="gate-input"
				class:gate-input-error={error}
				type="password"
				placeholder="Enter password"
				bind:value={input}
				autofocus
			/>
			<button class="gate-btn" type="submit">Enter</button>
			{#if error}
				<p class="gate-error">Incorrect password, try again.</p>
			{/if}
		</form>
	</div>
{/if}

{@render children?.()}

<style>
	.gate-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
	}

	.gate-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		width: 100%;
		max-width: 280px;
		padding: 24px;
		text-align: center;
	}

	.gate-label {
		font-family: Montserrat, sans-serif;
		font-size: 0.85rem;
		font-weight: 600;
		color: #000;
		margin: 0 0 4px;
	}

	.gate-input {
		width: 100%;
		box-sizing: border-box;
		padding: 8px 10px;
		font-family: Montserrat, sans-serif;
		font-size: 0.85rem;
		border: 1px solid #ccc;
		border-radius: 0;
		outline: none;
	}

	.gate-input:focus {
		border-color: rgb(0, 98, 234);
	}

	.gate-input-error {
		border-color: #d73027;
	}

	.gate-btn {
		width: 100%;
		padding: 8px 10px;
		font-family: Montserrat, sans-serif;
		font-size: 0.8rem;
		font-weight: 600;
		background: rgb(0, 98, 234);
		color: #fff;
		border: none;
		border-radius: 0;
		cursor: pointer;
	}

	.gate-btn:hover {
		background: rgb(0, 78, 187);
	}

	.gate-error {
		font-size: 0.72rem;
		color: #d73027;
		margin: 0;
	}
</style>