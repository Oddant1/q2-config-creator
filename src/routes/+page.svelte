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

<div class="min-h-screen bg-white text-black">
    <div class="relative">
        <div class="mx-auto max-w-6xl px-6 py-12 lg:px-8">
            <header class="flex flex-col gap-6">
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a414c] text-sm font-semibold text-white shadow-sm">
                        Q2
                    </div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">QIIME 2</p>
                        <h1 class="text-3xl font-semibold text-black sm:text-4xl">Parallel Config Creator</h1>
                    </div>
                </div>
                <p class="max-w-3xl text-lg leading-relaxed text-gray-700">
                    Generate PARSL configuration files for QIIME 2 pipelines. Use this to run workflows locally or scale
                    to Slurm-backed HPC clusters for compute-heavy pipelines like MOSHPIT and q2-boots.
                </p>
                <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span class="rounded-full border border-gray-300 bg-gray-50 px-3 py-1">Local or Slurm</span>
                    <span class="rounded-full border border-gray-300 bg-gray-50 px-3 py-1">Outputs TOML</span>
                    <a
                        class="inline-flex items-center gap-2 font-medium text-blue-700 underline decoration-blue-300/70 underline-offset-4 transition hover:text-blue-800"
                        href="https://use.qiime2.org/en/stable/references/parallel-configuration.html"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Read the parallel configuration guide
                    </a>
                </div>
            </header>

            <section class="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div class="space-y-8">
                    <div class="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h2 class="text-lg font-semibold text-black">Load an existing config</h2>
                                <p class="mt-2 text-sm text-gray-600">
                                    Drag in a TOML file created by this app to prefill the form and make quick edits.
                                </p>
                            </div>
                        </div>
                        <div class="mt-4">
                            <DropZone />
                        </div>
                    </div>

                    <div class="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
                        <div class="flex flex-col gap-2">
                            <h2 class="text-lg font-semibold text-black">Generate a new config</h2>
                            <p class="text-sm text-gray-600">
                                Fill out the fields below to create a `parallelConfig.toml` file you can pass to QIIME 2.
                            </p>
                        </div>

                        <!-- TODO: Disable this in some way while parsing a user input file (shouldn't take long) -->
                        <form class="mt-6 space-y-6" onsubmit={writeConfig}>
                            {#key $formModel.configType}
                                <div>
                                    <label class="text-sm font-medium text-gray-700" for="pcType">
                                        What type of computer are you using?
                                    </label>
                                    <select
                                        id="pcType"
                                        name="pcType"
                                        class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                        bind:value={formModel.configType}
                                    >
                                        <option value="local">local</option>
                                        <option value="slurm">slurm</option>
                                    </select>
                                </div>

                                {#if formModel.configType == "local"}
                                    <div class="grid gap-6 sm:grid-cols-2">
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="localExecutorType">
                                                Is the action you are running threadsafe?
                                            </label>
                                            <p class="mt-1 text-xs text-gray-500">If you are unsure, choose “No”.</p>
                                            <select
                                                id="localExecutorType"
                                                name="localExecutorType"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.local.localExecutorType}
                                            >
                                                <option value="HighThroughputExecutor">No</option>
                                                <option value="ThreadpoolExecutor">Yes</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="numTasks">
                                                How many threads/processes would you like to run?
                                            </label>
                                            <p class="mt-1 text-xs text-gray-500">More tasks require more memory.</p>
                                            <input
                                                id="numTasks"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.local.numTasks}
                                                type="number"
                                                min="1"
                                                pattern="\d*"
                                                required
                                            />
                                        </div>
                                    </div>
                                {:else}
                                    <div class="grid gap-6 sm:grid-cols-2">
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="maxBlocks">
                                                How many Slurm jobs do you want to submit?
                                            </label>
                                            <input
                                                id="maxBlocks"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.maxBlocks}
                                                type="number"
                                                min="1"
                                                pattern="\d*"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="walltime">
                                                Target walltime (HH:MM:SS)
                                            </label>
                                            <input
                                                id="walltime"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.walltime}
                                                pattern="\d*:\d\d:\d\d"
                                                placeholder="HH:MM:SS"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="nodesPerBlock">
                                                How many nodes per Slurm job?
                                            </label>
                                            <input
                                                id="nodesPerBlock"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.nodesPerBlock}
                                                type="number"
                                                min="1"
                                                pattern="\d*"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="workerPerNode">
                                                How many tasks per node?
                                            </label>
                                            <input
                                                id="workerPerNode"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.workersPerNode}
                                                type="number"
                                                min="1"
                                                pattern="\d*"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="cpusPerNode">
                                                How many CPUs per node?
                                            </label>
                                            <input
                                                id="cpusPerNode"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.cpusPerNode}
                                                type="number"
                                                min="1"
                                                pattern="\d*"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="cpusPerWorker">
                                                How many CPUs per task?
                                            </label>
                                            <input
                                                id="cpusPerWorker"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.cpusPerWorker}
                                                type="number"
                                                min="1"
                                                pattern="\d*"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-700" for="memPerNode">
                                                How much RAM per node (GB)?
                                            </label>
                                            <input
                                                id="memPerNode"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.memPerNode}
                                                type="number"
                                                min="1"
                                                pattern="\d*"
                                                required
                                            />
                                        </div>
                                        <div class="sm:col-span-2">
                                            <label class="text-sm font-medium text-gray-700" for="workerInit">
                                                What commands activate QIIME 2?
                                            </label>
                                            <p class="mt-1 text-xs text-gray-500">
                                                Separate multiple commands with `;`.
                                            </p>
                                            <input
                                                id="workerInit"
                                                class="mt-2 w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-700 focus:ring-blue-700"
                                                bind:value={formModel.formData.slurm.workerInit}
                                                placeholder="module load anaconda3; conda activate qiime2-amplicon-dev;"
                                                required
                                            />
                                        </div>
                                    </div>
                                {/if}

                                <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
                                    <p class="text-xs text-gray-500">
                                        Your config will download as `parallelConfig.toml`.
                                    </p>
                                    <button
                                        class="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                                        type="submit"
                                    >
                                        Generate config
                                    </button>
                                </div>
                            {/key}
                        </form>
                    </div>
                </div>

                <aside class="space-y-6">
                    <div class="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
                        <h3 class="text-base font-semibold text-black">How it works</h3>
                        <ul class="mt-3 space-y-2 text-sm text-gray-600">
                            <li>Pick local or Slurm to match your compute environment.</li>
                            <li>Provide the limits and resources your cluster supports.</li>
                            <li>Download the TOML file and pass it to `--p-parallel-config`.</li>
                        </ul>
                    </div>
                    <div class="rounded-2xl border border-gray-300 bg-gray-50 p-6 shadow-sm">
                        <h3 class="text-base font-semibold text-black">Good defaults</h3>
                        <p class="mt-2 text-sm text-gray-600">
                            Start with a small number of tasks, then increase once you confirm memory usage and runtime on
                            representative samples.
                        </p>
                    </div>
                </aside>
            </section>
        </div>
    </div>
</div>

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
