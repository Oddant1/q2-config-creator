<script lang="ts">
    import DropZone from '$lib/components/DropZone.svelte';
import { parse, stringify } from 'smol-toml';

    const json = $state({'parsl': {}});

    async function getConfig(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        json.parsl.pcType = data.get('pcType');
        json.parsl.num = 1

        const tomlString = stringify(json);

        const blob: Blob = new Blob([tomlString]);
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = blobUrl;
        link.download = 'parallelConfig.toml';

        document.body.appendChild(link);

        link.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            })
        );

        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }
</script>

<p>
    QIIME 2 features the ability to parallelize all QIIME 2 Pipelines using the PARSL parallel scripting library under the
    hood. Running small workflows in parallel on a laptop requires minimal configuration, and can be achieved by simply passing
    the --p-parallel flag to the pipeline you are running without additional configuration; however, QIIME 2 also support
    parallelizing large scale workflows across multiple nodes on a compute cluster. This is particularly useful for pipelines
    in MOSHPIT and q2-boots which often do the same type of calculation a very large number of times on a large set of data.
</p>
<br />
<p>
    This webapp can help you create a file to pass into the --p-parallel-config parameter og a QIIME 2 Pipeline you want to
    run in parallel on an HPC cluster using the slurm scheduler. PARSL and thus QIIME 2 do support schedulers other than slurm,
    but this app currently only supports creating slurm configs. More information about QIIME 2 parallel configuration may be
    found <a class="underline text-blue-600" href="https://use.qiime2.org/en/stable/references/parallel-configuration.html" target="_blank">here</a>.
</p>
<br />

<DropZone />

<!-- TODO: Disable this in some way while parsing a user input file (shouldn't take long) -->
<form onsubmit={getConfig}>
    <label for="max_blocks">
        How many slurm jobs would you like to run concurrently. Note this is the maximum
        number of jobs that could be running simultaneously. There is no guarantee this
        many will be running at all times.
    </label>
    <input type="number" min="1">

    <label for="pcType">What type of computer are you using?</label>
    <select id="pcType" name="pcType" bind:value={json.parsl.pcType}>
        <option value="HPC">HPC</option>
        <option value="local">local</option>
    </select>
    {#if json.parsl.pcType == "local"}
        <label for="thing1">Is the action you are</label>
        <select id="thing1" name="thing1" bind:value={json.parsl.thing1}>
            <option value="HPC">HPC</option>
            <option value="local">local</option>
        </select>
    {:else}
        <label for="thing2">Is the action you are</label>
        <select id="thing2" name="thing2" bind:value={json.parsl.thing2}>
            <option value="HPC">HPC</option>
            <option value="local">local</option>
        </select>
    {/if}
    <br /><br />
    <button>Generate Config</button>
</form>

<!-- For creating the actual action submission? -->
<!-- <form> -->
<!-- Set this to cores_per_block / workers_per_block -->
Does your action have a --p-threads param?
<!-- Set this to same as max-blocks -->
Does your action have a --p-partitions param?
<!-- </form> -->

<!-- For creating the parallel config -->
<!-- <form> -->
<!-- Are you running on an hpc? Y/N -->
<!-- Y -->
<!-- Are you using slurm? Y/N -->
<!-- Y -->
<!-- Sets max_blocks -->
How many slurm jobs do you want to submit?
<!-- Sets nodes_per_block -->
How many nodes do you want each job to use?
<!-- Sets cores_per_node -->
How many CPUs do you want per node? NOTE: If the action you are running has a parallel param you will
want to set it such that it actually uses all CPUs. In general, this can be accomplished by setting the
parallel parameter to the action to cores_per_worker / workers_per_node
<!-- Sets mem_per_node -->
How much memory in GB do you want per node?
<!-- Sets walltime -->
How long do you expect the job to take?
<!-- Sets the worker_init -->
What commands do you need to run to activate your QIIME 2 environment? These commands will be run on the
compute node(s) to activate QIIME 2
<!-- N -->
<!-- Currently only supports detailed support for slurm -->
<!-- N -->
Is the action you are running threadsafe? If you don't know the answer to this, choose no. How many CPUs
do you have?
<!-- ... -->
<!-- </form> -->
