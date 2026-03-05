import type { Command } from "commander";

function generateBashCompletions(program: Command): string {
	const commands = program.commands.map((c) => c.name()).join(" ");
	const aliases = program.commands.flatMap((c) => c.aliases()).join(" ");
	const allCommands = `${commands} ${aliases}`.trim();

	return `# bash completion for xrpl
_xrpl_completions() {
    local cur prev commands
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    commands="${allCommands}"

    if [[ \${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
        return 0
    fi

    # Complete global options
    if [[ "\${cur}" == -* ]]; then
        local opts="--network --rpc-url --seed --keyfile --json --quiet --yes --help --version"
        COMPREPLY=( $(compgen -W "\${opts}" -- "\${cur}") )
        return 0
    fi
}
complete -F _xrpl_completions xrpl
`;
}

function generateZshCompletions(program: Command): string {
	const lines = [
		"#compdef xrpl",
		"",
		"_xrpl() {",
		"    local -a commands",
		"    commands=(",
	];
	for (const cmd of program.commands) {
		const desc = cmd.description().replace(/'/g, "'\\''");
		lines.push(`        '${cmd.name()}:${desc}'`);
		for (const alias of cmd.aliases()) {
			lines.push(`        '${alias}:${desc}'`);
		}
	}
	lines.push("    )", "", '    _describe "command" commands', "}", "", "_xrpl");
	return `${lines.join("\n")}\n`;
}

function generateFishCompletions(program: Command): string {
	const lines = ["# fish completion for xrpl"];
	for (const cmd of program.commands) {
		const desc = cmd.description().replace(/'/g, "\\'");
		lines.push(
			`complete -c xrpl -n '__fish_use_subcommand' -a '${cmd.name()}' -d '${desc}'`,
		);
		for (const alias of cmd.aliases()) {
			lines.push(
				`complete -c xrpl -n '__fish_use_subcommand' -a '${alias}' -d '${desc}'`,
			);
		}
	}
	return `${lines.join("\n")}\n`;
}

export function registerCompletions(program: Command) {
	program
		.command("completions")
		.description("Generate shell completion scripts")
		.argument("<shell>", "Shell type: bash, zsh, or fish")
		.action((shell: string) => {
			switch (shell) {
				case "bash":
					console.log(generateBashCompletions(program));
					break;
				case "zsh":
					console.log(generateZshCompletions(program));
					break;
				case "fish":
					console.log(generateFishCompletions(program));
					break;
				default:
					console.error(`Unknown shell "${shell}". Supported: bash, zsh, fish`);
					process.exit(1);
			}
		});
}
