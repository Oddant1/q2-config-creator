<script lang="ts">
    import { stringify } from 'smol-toml';

    import DropZone from '$lib/components/DropZone.svelte';
    import formModel from '$lib/models/formModel';

    async function writeConfig(event: SubmitEvent) {
        event.preventDefault();

        let tomlString = "";
        // Shared info across all configs we might write
        const jsonConfig = {"parsl": {"executors": [{"name": "default"}]}}

        switch (formModel.configType) {
            case "local":
                _createLocalConfigJson(jsonConfig);
                // Header not needed here due to strategy = "None" being a key
                // value pair directly under parsl
                break;
            case "slurm":
                _createSlurmConfigJson(jsonConfig);
                // This header bit isn't added in this case
                tomlString = '[parsl]\n\n' + tomlString;
                break;
            default:
                // TODO: Complain
                break;
        }

        tomlString += stringify(jsonConfig);

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

    function _createLocalConfigJson(jsonConfig) {
        jsonConfig.parsl['strategy'] = 'None';
        const executor = jsonConfig.parsl.executors[0];
        executor['class'] = formModel.formData.local.localExecutorType;

        switch (formModel.formData.local.localExecutorType) {
            case "HighThroughputExecutor":
                executor['max_workers'] = formModel.formData.local.numTasks;
                executor['provider'] = {'class': 'LocalProvider'}
                break;
            case "ThreadPoolExecutor":
                executor['max_threads'] = formModel.formData.local.numTasks
                break;
            default:
                // TODO: Complain
                break;
        }
    }

    function _createSlurmConfigJson(jsonConfig) {
        const executor = jsonConfig.parsl.executors[0];
        executor['class'] = 'HighThroughputExecutor';
        executor['cores_per_worker'] = formModel.formData.slurm.cpusPerWorker;
        executor['max_workers_per_node'] = formModel.formData.slurm.workersPerNode;

        executor['provider'] = {
            'class': 'SlurmProvider',
            'max_blocks': formModel.formData.slurm.maxBlocks,
            'nodes_per_block': formModel.formData.slurm.nodesPerBlock,
            'cores_per_node': formModel.formData.slurm.cpusPerNode,
            'mem_per_node': formModel.formData.slurm.memPerNode,
            'walltime': formModel.formData.slurm.walltime,
            // TODO: Do we want to hardcode this?
            'exclusive': false,
            'worker_init': formModel.formData.slurm.workerInit
        }
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
    This webapp can help you create a file to pass into the --p-parallel-config parameter of a QIIME 2 Pipeline you want to
    run in parallel on an HPC cluster using the slurm scheduler. PARSL and thus QIIME 2 do support schedulers other than slurm,
    but this app currently only supports creating slurm configs. More information about QIIME 2 parallel configuration may be
    found <a class="underline text-blue-600" href="https://use.qiime2.org/en/stable/references/parallel-configuration.html" target="_blank">here</a>.
</p>
<br />

<DropZone />

<!-- TODO: Disable this in some way while parsing a user input file (shouldn't take long) -->
<form onsubmit={writeConfig}>
    {#key $formModel.configType}
        <label for="pcType">What type of computer are you using?</label>
        <select id="pcType" name="pcType" bind:value={formModel.configType}>
            <option value="local">local</option>
            <option value="slurm">slurm</option>
        </select>
        <br/>
        {#if formModel.configType == "local"}
            <label for="localExecutorType">Is the action you are running threadsafe? (If you don't know choose no.)</label>
            <select id="localExecutorType" name="localExecutorType" bind:value={formModel.formData.local.localExecutorType}>
                <option value="HighThroughputExecutor">No</option>
                <option value="ThreadpoolExecutor">Yes</option>
            </select>
            <br/>
            <label for="numTasks">How many threads/processes would you like to run Note: More threads/processes means more memory usage</label>
            <input id="numTasks" bind:value={formModel.formData.local.numTasks} type="number" min="1" pattern="\d*" required>
        {:else}
            <label for="maxBlocks">How many Slurm jobs do you want to submit?</label>
            <input id="maxBlocks" bind:value={formModel.formData.slurm.maxBlocks} type="number" min="1" pattern="\d*" required>
            <br/>
            <label for="walltime">What would you like the walltime for your Slurm jobs (maximum runtime of each job) to be in HH:MM:SS?</label>
            <input id="walltime" bind:value={formModel.formData.slurm.walltime} pattern="\d*:\d\d:\d\d" placeholder="HH:MM:SS" required>
            <br/>
            <label for="nodesPerBlock">How many nodes do you want per slurm job?</label>
            <input id="nodesPerBlock" bind:value={formModel.formData.slurm.nodesPerBlock} type="number" min="1" pattern="\d*" required>
            <br/>
            <label for="workersPerNode">How many tasks do you want running simultaneously per node?</label>
            <input id="workerPerNode" bind:value={formModel.formData.slurm.workersPerNode} type="number" min="1" pattern="\d*" required>
            <br/>
            <label for="cpusPerNode">How many CPUSs do you want per node?</label>
            <input id="cpusPerNode" bind:value={formModel.formData.slurm.cpusPerNode} type="number" min="1" pattern="\d*" required>
            <br/>
            <label for="cpusPerWorker">How many CPUSs do you want per task?</label>
            <input id="cpusPerWorker" bind:value={formModel.formData.slurm.cpusPerWorker} type="number" min="1" pattern="\d*" required>
            <br/>
            <label for="memPerNode">How much RAM do you want per node in GB?</label>
            <input id="memPerNode" bind:value={formModel.formData.slurm.memPerNode} type="number" min="1" pattern="\d*" required>
            <br/>
            <label for="workerInit">What command(s) do you need to run to activate QIIME 2? If there are multiple commands please seperate them with ;</label>
            <input id="workerInit" bind:value={formModel.formData.slurm.workerInit} placeholder="module load anaconda3; conda activate qiime2-amplicon-dev;" required>
            <br/>
        {/if}
        <br /><br />
        <button>Generate Config</button>
    {/key}
</form>

<!-- For creating the actual action submission? -->
<!-- <form> -->
<!-- Set this to cores_per_block / workers_per_block -->
<!-- Does your action have a --p-threads param? -->
<!-- Set this to same as max-blocks -->
<!-- Does your action have a --p-partitions param? -->
<!-- </form> -->

<!-- For creating the parallel config -->
<!-- <form> -->
<!-- Are you running on an hpc? Y/N -->
<!-- Y -->
<!-- Are you using slurm? Y/N -->
<!-- Y -->
<!-- Sets max_blocks -->
<!-- How many slurm jobs do you want to submit? -->
<!-- Sets nodes_per_block -->
<!-- How many nodes do you want each job to use? -->
<!-- Sets cores_per_node -->
<!-- How many CPUs do you want per node? NOTE: If the action you are running has a parallel param you will
want to set it such that it actually uses all CPUs. In general, this can be accomplished by setting the
parallel parameter to the action to cores_per_worker / workers_per_node -->
<!-- Sets mem_per_node -->
<!-- How much memory in GB do you want per node? -->
<!-- Sets walltime -->
<!-- How long do you expect the job to take? -->
<!-- Sets the worker_init -->
<!-- What commands do you need to run to activate your QIIME 2 environment? These commands will be run on the
compute node(s) to activate QIIME 2 -->
<!-- N -->
<!-- Currently only supports detailed support for slurm -->
<!-- N -->
<!-- Is the action you are running threadsafe? If you don't know the answer to this, choose no. How many CPUs
do you have? -->
<!-- ... -->