<script>
	import "../assets/global-styles.css";
	import { base } from "$app/paths";

	import Logo from "$lib/header-footer/LogoTop.svelte";
	import Footer from "$lib/header-footer/Footer.svelte";
</script>

<svelte:head>
	<title>TAC EDDIT | Toronto Arts Council</title>
	<meta
		name="description"
		content="Equitable development initiative: exploring activity, demography, and access across Toronto Arts Council venues."
	/>
</svelte:head>

<main>
	<Logo logoType="Blue" backgroundColor="var(--brandWhite)" />

	<div class="landing">
		<h1>TAC Equitable Development Initiative</h1>
		<p>
			Exploring activity, demography, and access across Toronto Arts
			Council venues.
		</p>

		<a class="cta" href="{base}/map">Explore the Map</a>
	</div>

	<Footer />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.landing {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		max-width: 720px;
		margin: 0 auto;
		padding: 40px 35px;
		text-align: left;
	}

	h1 {
		font-family: TradeGothicBold, sans-serif;
		color: var(--brandDarkBlue);
		font-size: 2.4rem;
		margin: 0 0 12px 0;
	}

	.landing p {
		font-family: SourceSerif, serif;
		color: var(--brandGray80);
		font-size: 1.1rem;
		line-height: 1.5;
		margin: 0 0 28px 0;
	}

	.cta {
		display: inline-block;
		background-color: var(--brandDarkBlue);
		color: var(--brandWhite);
		font-family: Montserrat, sans-serif;
		font-weight: bold;
		text-decoration: none;
		padding: 14px 28px;
		border-radius: 4px;
		transition: opacity 0.15s ease;
	}

	.cta:hover {
		opacity: 0.85;
	}

	@media (max-width: 730px) {
		.landing {
			padding: 25px 15px;
		}

		h1 {
			font-size: 1.8rem;
		}
	}
</style>
