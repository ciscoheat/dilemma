<script type="ts">
    export let name
    export let opener
</script>

<a href="javascript:;" class="p-1" on:click|preventDefault={() => opener(name)}>
    <slot></slot>
</a>