<script type="ts">
    export let name : string
    export let close : (name : string) => void
</script>

<div class="modal modal-animated--zoom-in" id={name} on:click|self={() => close(name)}>
    <div class="modal-content" role="document">
        <slot></slot>
    </div>
</div>

<style lang="scss">
    .modal {
        background-color: rgba($color: #000000, $alpha: 0.25);
    }
</style>