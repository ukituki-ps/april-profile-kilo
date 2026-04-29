/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProfileListItem } from './ProfileListItem';
export type ProfileListResponse = {
    items: Array<ProfileListItem>;
    /**
     * Курсор следующей страницы, `null` на конце списка.
     */
    next_cursor?: (string | null);
    total_count: number;
};

