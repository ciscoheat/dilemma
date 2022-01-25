<script lang="ts">
    export let nr : 1 | 2
    export let won : boolean | null
	export let name = ''
    export let score = 0
    export let state = null
    export let update : (name: string) => void
    export let coop : () => void
    export let cheat : () => void
</script>

<input 
    class:player1={nr==1} class:player2={nr==2} 
    class="u-text-center input-large"
    type="text" value={name} 
    on:input={e => update(e.currentTarget.value)}
    on:click={e => e.currentTarget.select()}
>
<div class:bg-green-100={won === true} class:bg-red-100={won === false} class="card score my-2 px-3" style="margin:0 auto; width:max-content;">
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
        margin-left: auto;
        margin-right: auto;
    }
</style>