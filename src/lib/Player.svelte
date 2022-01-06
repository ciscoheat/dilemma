<script>
	export let name = ''
    export let score = 0
    export let state = null
    export let coop
    export let cheat
</script>

<input type="name" bind:value={name} class="u-text-center">
<div class="card score my-2">
    <div class="content u-center">
        <h1>{score}</h1>
    </div>
</div>
<div class="u-flex u-justify-space-evenly">
    <div class="btn" class:btn-success={state === true} on:click={e => coop()} title="Cooperate">
        <span class="icon subtitle" style="font-size: 28px">
            <i class="far fa-wrapper fa-thumbs-up"></i>
        </span>
    </div>
    <div class="btn" class:btn-danger={state === false} on:click={e => cheat()} title="Cheat/defect">
        <span class="icon subtitle" style="font-size: 28px">
            <i class="far fa-wrapper fa-hand-rock"></i>
        </span>
    </div>
</div>

<style lang="scss">
    .score {
        margin-left: 30%;
        margin-right: 30%;
    }
</style>