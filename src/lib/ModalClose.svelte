<script type="ts">
    export let classes = ''
    export let closer
</script>

<a href="javascript:;" on:click|preventDefault={() => closer()} class={classes} aria-label="Close">
    <slot></slot>
</a>