<script>
	import { createEventDispatcher } from 'svelte'

	export let title
    export let actions
    export let points
    export let field

    const dispatch = createEventDispatcher()

    const updateField = (e) => {
        const value = parseInt(e.target.value)
        if(isNaN(value)) return

        dispatch('input', {field, value})
    }
</script>

<tr>
    <td>
        <span class="m-0 mr-1">{title}</span>
        <span class="icon">
            <i class="far fa-wrapper" class:fa-thumbs-up={actions[0]} class:fa-hand-rock={!actions[0]}></i>
        </span>
        <span class="icon">
            <i class="far fa-wrapper" class:fa-thumbs-up={actions[1]} class:fa-hand-rock={!actions[1]}></i>
        </span>
    </td>
    <td>
        <input type="number" class="input-small" on:input={updateField} value={points} style="max-width:100px">
    </td>
</tr>

<style lang="scss">
    td {
        vertical-align: baseline;
    }
</style>