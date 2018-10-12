# Contributing to Atomist open source projects

Have something you would like to contribute to this project?  Awesome,
and thanks for taking time to contribute!  Here's what you need to
know.

## Contributing code

Is there an improvement to existing functionality or an entirely new
feature you would like to see?  Before creating enhancement
suggestions, please check the issue list as you might find out that
you don't need to create one.

Did you know we have a [Slack community][slack]?  This might be a
great place to talk through your idea before starting.  It allows you
to see if anyone else is already working on something similar, having
the same issue or to get feedback on your enhancement idea.
Discussing things with the community first is likely to make the
contribution process a better experience for yourself and those that
are maintaining the projects.

[slack]: https://join.atomist.com/

If you do not find an open issue related to your contribution and
discussions in the Slack community are positive, the next thing to do
is to create an issue in the appropriate GitHub repository.

*   Before we can accept any code changes into the Atomist codebase,
    we need to get some of the legal stuff covered.  This is pretty
    standard for open-source projects.  We are using
    [cla-assisant.io][cla-assistant] to track our Contributor License
    Agreement (CLA) signatures.  If you have not signed a CLA for the
    repository to which you are contributing, you will be prompted to
    when you create a pull request (PR).
*   Be sure there is an open issue related to the contribution.
*   Code contributions should successfully build and pass tests.
*   Commit messages should follow the [standard format][commit] and
    should include a [reference][ref] to the open issue they are
    addressing.
*   All code contributions should be submitted via
    a [pull request (PR) from a forked GitHub repository][pr].
*   Your PR will be reviewed by an Atomist developer.

[cla-assistant]: https://cla-assistant.io/
[commit]: http://chris.beams.io/posts/git-commit/
[ref]: https://github.com/blog/957-introducing-issue-mentions
[pr]: https://guides.github.com/activities/contributing-to-open-source/

## Reporting problems

Please go through the checklist below before reporting a
problem. There's a chance it may have already been reported, or
resolved.

*   Check if you can reproduce the problem in the latest version of
    the project.
*   Search the [atomist-community Slack][slack] community for common
    questions and problems.
*   Understand which repo the bug should be reported in.
*   Scan the list of issues to see if the problem has previously been
    reported.  If so, you may add a comment to the existing issue
    rather than creating a new one.

You went through the list above and it is still something you would
like to report?  Then, please provide us with as much of the context,
by explaininig the problem and including any additional details that
would help maintainers reproduce the problem.  The more details you
provide in the bug report, the better.

Bugs are tracked as GitHub issues.  After you've determined which
repository your bug is related to, create an issue on that repository
and provide as much information as possible.  Feel free to use
the bug report template below if you like.

At a minimum include the following:

*   Where did you find the bug? For example, did you encounter the bug
    in chat, the CLI, somewhere else?
*   What version are you using?
*   What command were you using when it happened? (including
    parameters where applicable)

```
[Description of the problem]

**How to Reproduce:**

1.  [First Step]
2.  [Second Step]
3.  [n Step]

**Expected behavior:**

[Describe expected behavior here]

**Observed behavior:**

[Describe observed behavior here]

**Screenshots and GIFs**

![Screenshots and GIFs which follow reproduction steps to demonstrate the problem](url)

**Project version:** [Enter project version]
**Atomist CLI version:** [Enter CLI version]
```

This project adheres to the Contributor Covenant [code of
conduct][conduct].  By participating, you are expected to uphold this
code.  Please report unacceptable behavior to
[code-of-conduct@atomist.com][email].

[conduct]: CODE_OF_CONDUCT.md
[email]: mailto:code-of-conduct@atomist.com
