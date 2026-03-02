<script lang="ts">
    import formModel from "$lib/models/formModel";

    let files: FileList = $state();
    let isDragging = $state(false);
    let isSelected = false;

    function onDragOver(event: DragEvent) {
        isDragging = true;
        event.preventDefault();
    }

    function onDragLeave(event: DragEvent) {
        isDragging = false;
    }

    function onDrop(event: DragEvent) {
        isDragging = false;
        event.preventDefault();

        let items = event.dataTransfer?.files;

        if (items !== undefined) {
            files = items;
        }
    }

    function fileChange(event) {
        // Reset to null so using the same file multiple times works
        event.target.value = null;
    }

    $effect(() => {
        if (files) {
            if (files.length < 1) {
                // Do nothing.
                //
                // If you open the file input window then close it, you get an empty file
                // list which can trigger this code. If this code was triggered with no
                // files just ignore it
            } else if (files.length > 1) {
                alert("Please only provide a single file.");
            } else {
                formModel.readConfig(files[0]);
            }
        }
    });
</script>

<div
  id="dropzone"
  class:isDragging
  class:isSelected
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
  role="button"
  tabindex="0"
>
  <input id="dropinput" bind:files onchange={(event) => fileChange(event)} type="file" accept=".toml"/>
  <div class="text-xl text-gray-700 text-center">
    <h1 class="mt-2.5 mb-1 text-4xl">Drag and drop or click here</h1>
        To load an existing config from your computer. Please note we only guarantee we will be able to load
        configs previously created by this webapp.
  </div>
</div>

<style lang="postcss">
  @reference "tailwindcss";

  #dropzone {
    box-shadow: rgb(153, 153, 153) 5px 5px 5px;
    @apply relative
      border-4
      border-dashed
      border-gray-300
      rounded-lg
      w-full
      p-12
      bg-gray-100
      mb-4;
  }

  #dropzone.isDragging {
    @apply border-solid
      shadow-inner
      font-bold;
  }

  #dropinput {
    @apply cursor-pointer
      opacity-0
      absolute
      top-0
      right-0
      bottom-0
      left-0
      w-full
      h-full;
  }
</style>