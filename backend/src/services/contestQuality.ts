import { Util } from '../util/util';
import config from '../config/config';

function isAnyErrorPresent(obj: any): boolean {
    var error = false;

    Object.values(obj).forEach((val: any) => {
        if (isNaN(val?.length)) {
            if (isAnyErrorPresent(val)) {
                error = true;
                return;
            }
        } else if (val.length > 0) {
            error = true;
            return;
        }
    });

    return error;
}

export function computeContestQuality(competition: any) {
    var warnings: any = {};
    warnings.blockers = [];

    if (!competition.title) {
        warnings.title = ['Competition title is empty.'];
    }

    if (!competition.description) {
        warnings.description = ['Competition has no description.'];
    }

    if (!competition.questions.length) {
        warnings.questions = ['Competition has no questions.'];
        warnings.blockers.push('Competition has no questions.');
    }

    warnings.questionsAcceptable = true;

    competition.questions.forEach((question: any) => {
        warnings[question.id] = {};
        var questionWarnings = warnings[question.id];
        questionWarnings.blockers = [];

        if (!question.title) {
            questionWarnings.title = ['Question title is empty.'];
        }

        if (question.type === config.questionTypes.code) {
            if (!question.sample_sols) {
                questionWarnings.sample_sols = [
                    "No sample solution has been set, hunter cannot evaluate users' output when there is nothing to compare to.",
                ];
            }

            if (
                !Util.doesTestFilesExist({
                    for: {
                        competition_id: competition.id,
                        question_id: question.id,
                        type: 0,
                    },
                    solution: { code: '', lang: 'c' },
                })
            ) {
                questionWarnings.sample_sols = [
                    'File to specify solution output of your question has not been set, this makes your question simply un-solvable.',
                ];
                questionWarnings.blockers.push(
                    questionWarnings.sample_sols[0],
                );
            }

            if (!question.question_verifications.length) {
                questionWarnings.question_verifications = [
                    'Verification request for the solutions file to test the solvability of the coding task has not been submitted, hunter cannot ensure whether your coding task is solvable or not.',
                ];
                questionWarnings.blockers.push(
                    questionWarnings.question_verifications[0],
                );
            }
        }

        if (question.type === config.questionTypes.mcq) {
            questionWarnings.question_choices = [];

            if (question.question_choices.length < 2) {
                questionWarnings.question_choices.push(
                    'Question do no have enough (at least 2 required) number of choices to choose from.',
                );
                questionWarnings.blockers.push(
                    'Question do no have enough (at least 2 required) number of choices to choose from.',
                );
            }

            if (
                question.question_choices?.length &&
                question.question_choices.every((q) => q.is_correct)
            ) {
                questionWarnings.question_choices.push(
                    'All choices in the question have been marked as correct, which is un-acceptable.',
                );
            }

            if (
                question.question_choices.every(
                    (q) => !q.is_correct,
                )
            ) {
                questionWarnings.question_choices.push(
                    'There is no choice in the question that is marked as correct, which makes the question unsolvable.',
                );
                questionWarnings.blockers.push(
                    'There is no choice in the question that is marked as correct, which makes the question unsolvable.',
                );
            }
        }

        if (question.type === config.questionTypes.fill) {
            questionWarnings.question_choices = [];

            if (!question.question_choices.length) {
                questionWarnings.question_choices.push(
                    'Question do not have any possible answer, which makes the question un-solvable.',
                );
                questionWarnings.blockers.push(
                    'Question do not have any possible answer, which makes the question un-solvable.',
                );
            }
        }

        questionWarnings.acceptable = true;

        if (isAnyErrorPresent(questionWarnings)) {
            warnings.questionsAcceptable = false;
            questionWarnings.acceptable = false;
        }
    });

    warnings.acceptable = !isAnyErrorPresent(warnings);

    return warnings;
}
