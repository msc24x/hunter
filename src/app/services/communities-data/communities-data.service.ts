import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { format } from 'src/app/utils/utils';
import {
    apiEndpoints,
    Community,
    CommunityMember,
} from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunitiesDataService {
    constructor(private http: HttpClient) {}

    fetchCommunity(params: { id?: string | number | null }) {
        let url = format(apiEndpoints.community, params.id?.toString() || '');

        return this.http.get<Community>(url, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    fetchCommunities(params: { user_id?: number | null }) {
        let httpParams = new HttpParams();

        if (params.user_id) {
            httpParams = httpParams.set('user_id', params.user_id);
        }

        return this.http.get<Array<Community>>(apiEndpoints.communities, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
            params: httpParams,
        });
    }

    fetchCommunityMemberships(params: {
        community_id?: number | string | null;
    }) {
        let httpParams = new HttpParams();

        if (params.community_id) {
            httpParams = httpParams.set('community_id', params.community_id);
        }

        return this.http.get<Array<CommunityMember>>(
            apiEndpoints.communityMemberships,
            {
                withCredentials: true,
                responseType: 'json',
                observe: 'response',
                params: httpParams,
            }
        );
    }

    fetchPendingMembershipRequests(params: {
        community_id?: number | string | null;
    }) {
        let url = format(
            apiEndpoints.pendingCommunityMemberships,
            params.community_id?.toString() || ''
        );

        return this.http.get<Array<CommunityMember>>(url, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    fetchApprovedMembershipRequests(params: {
        community_id?: number | string | null;
    }) {
        let url = format(
            apiEndpoints.approvedCommunityMemberships,
            params.community_id?.toString() || ''
        );

        return this.http.get<Array<CommunityMember>>(url, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    requestCommunityMembership(params: { community_id: string | number }) {
        let url = format(apiEndpoints.joinCommunity, params.community_id);

        return this.http.post<CommunityMember>(
            url,
            {},
            {
                withCredentials: true,
                responseType: 'json',
                observe: 'response',
            }
        );
    }

    updateCommunityMembership(params: {
        community_id: string | number;
        members: Array<CommunityMember>;
        operation: 'accept' | 'reject' | 'disable';
    }) {
        let url = format(
            apiEndpoints.updateCommunityMemberships,
            params.community_id,
            params.operation
        );

        return this.http.patch(url, params.members, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    sendCommunityCreateRequest(params: {
        name: string;
        description: string;
        website_link: string;
        logo_file_path: string;
    }) {
        return this.http.post<Community>(apiEndpoints.createCommunity, params, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    updateCommunity(params: { community: Community }) {
        let url = format(apiEndpoints.updateCommunity, params.community.id);
        return this.http.patch<Community>(url, params.community, {
            withCredentials: true,
            responseType: 'json',
            observe: 'response',
        });
    }

    leaveCommunity(params: { community_id: string | number }) {
        const url = format(apiEndpoints.leaveCommunity, params.community_id);
        return this.http.post(
            url,
            {},
            {
                withCredentials: true,
                responseType: 'json',
                observe: 'response',
            }
        );
    }
}
