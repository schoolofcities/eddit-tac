<script>
  // Desktop-only strip under the map: just the Venue Profile, laid out
  // as one horizontal row. Read-only — selection is owned by the page.
  import VenueProfile from "$lib/venue-profile/VenueProfile.svelte";

  let {
    selectedVenueId = null,
    venueDisplayMode = "some", // "some" | "all"
    venues = [],
  } = $props();

  const selectedVenue = $derived(
    venues.find((v) => v.id === selectedVenueId) ?? null,
  );
</script>

<!-- Fallback for the boundary below, defined once at the top level -->
{#snippet profileFailed(err, reset)}
  <p class="empty-state">
    Couldn't display this venue's profile.
    <button type="button" class="retry" onclick={reset}>Try again</button>
  </p>
  <p class="error-detail">{err?.message ?? String(err)}</p>
{/snippet}

<aside class="profile-panel" aria-label="Venue profile">
  <section class="profile-section">
    <h2 class="section-heading">Venue Profile</h2>

    {#if venueDisplayMode === "all"}
      <p class="empty-state">
        Switch to "Some" to view a venue's activity and demographic profile.
      </p>
    {:else if selectedVenue}
      <!-- If anything inside the profile throws, contain it here so the map
           and left panel keep responding to the selection. -->
      <svelte:boundary
        failed={profileFailed}
        onerror={(err) =>
          console.error(`[TacProfilePanel] venue ${selectedVenue.id} failed to render`, err)}
      >
        <VenueProfile venueId={selectedVenue.id} layout="row" />
      </svelte:boundary>
    {:else}
      <p class="empty-state">
        Choose a venue from the list or click a marker on the map to see its
        activity and demographic profile.
      </p>
    {/if}
  </section>
</aside>

<style>
  /* Fills the grid cell; scrolls sideways if the row is wider, never down */
  .profile-panel {
    width: 100%;
    height: 100%;
    background: rgb(246, 246, 246);
    color: var(--brandBlack);
    font-family: Montserrat, sans-serif;
    font-size: 0.8rem;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--brandGray) transparent;
  }

  /* Full height so VenueProfile's row can stretch its blocks top to bottom */
  .profile-section {
    height: 100%;
    box-sizing: border-box;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
  }

  .section-heading {
    font-family: Montserrat, sans-serif;
    font-weight: bold;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgb(0, 98, 234);
    margin: 0 0 8px;
  }

  .retry {
    font: inherit;
    font-style: normal;
    color: rgb(0, 98, 234);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }

  .error-detail {
    font-size: 0.68rem;
    color: #b3261e;
    margin: 6px 0 0;
    word-break: break-word;
  }

  .empty-state {
    font-size: 0.73rem;
    color: #000;
    line-height: 1.5;
    font-style: italic;
    margin: 0;
  }
</style>