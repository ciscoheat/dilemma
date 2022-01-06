<script type="ts">
    export let name
    export let opener
</script>

<a href="javascript:;" on:click|preventDefault={() => opener(name)}>
    <slot></slot>
</a>