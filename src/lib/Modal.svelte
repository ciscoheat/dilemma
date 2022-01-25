<script type="ts">
    export let name : string
    export let close : (name : string) => void
</script>

<div class="modal modal-animated--zoom-in" id={name} on:click|self={() => close(name)}>
    <slot></slot>
</div>

<style lang="scss">
    .modal {
        background-color: rgba($color: #000000, $alpha: 0.25);
    }
</style>