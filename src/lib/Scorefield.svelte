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
        <span class="title m-0 mr-1">{title}</span>
        <div class="actions u-inline-block">
            <span class="icon">
                <i class="far fa-wrapper" class:fa-thumbs-up={actions[0]} class:fa-hand-rock={!actions[0]}></i>
            </span>
            <span class="icon">
                <i class="far fa-wrapper" class:fa-thumbs-up={actions[1]} class:fa-hand-rock={!actions[1]}></i>
            </span>
        </div>
    </td>
    <td>
        <input type="number" class="input-small" on:input={updateField} value={points}>
    </td>
</tr>

<style lang="scss">
    td {
        vertical-align: middle;
    }

    input {
        width: 90px!important;
    }
</style>