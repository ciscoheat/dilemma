<script type="ts">
    export let name
    export let closer
</script>

<div class="modal modal-animated--zoom-in" id={name} on:click|self={closer}>
    <slot></slot>
</div>

<style lang="scss">
    .modal {
        background-color: rgba($color: #000000, $alpha: 0.25);
    }
</style>