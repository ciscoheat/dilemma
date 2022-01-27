<script lang="ts">
    import type { Action, GameState } from "./App.svelte";

    export let gameState : GameState
    export let nr : 1 | 2
	export let name = ''
    export let score = 0
    export let action : Action
    export let update : (name: string) => void
    export let coop : () => void
    export let cheat : () => void

    let won : boolean | null = null
    let lost : boolean | null = null

    $: {
        if(gameState.state == "ended") {
            won =  (nr == 1 && gameState.p1won)  || (nr == 2 && gameState.p2won)
            lost = (nr == 1 && !gameState.p1won) || (nr == 2 && !gameState.p2won)
        } else {
            won = null
            lost = null
        }
    }
</script>
<input 
    disabled={(gameState.state != "not started") || null}
    class:player1={nr==1} class:player2={nr==2} 
    class="u-text-center input-large"
    type="text" value={name} 
    on:input={e => update(e.currentTarget.value)}
    on:click={e => e.currentTarget.select()}
>
<div class:bg-green-100={won} class:bg-red-100={lost} class="card score my-2 px-3" style="margin:0 auto; width:max-content;">
    <div class="content u-center">
        <h1>{score}</h1>
    </div>
</div>
<div class="u-flex u-justify-space-evenly">
    <div class="btn" class:btn-success={action === "C"} on:click={() => coop()} title="Cooperate">
        <span class="icon subtitle" style="font-size: 28px">
            <i class="far fa-wrapper fa-thumbs-up"></i>
        </span>
    </div>
    <div class="btn" class:btn-danger={action === "D"} on:click={() => cheat()} title="Cheat/defect">
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

    input:disabled {
        background-color: initial !important;
    }
</style>