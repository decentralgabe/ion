import IServiceStateStore from '../../lib/common/interfaces/IServiceStateStore';
import ServiceStateModel from '../../lib/core/models/ServiceStateModel';
export default class MockServiceStateStore implements IServiceStateStore<ServiceStateModel> {
    private serviceState;
    put(serviceState: ServiceStateModel): Promise<void>;
    get(): Promise<ServiceStateModel>;
}
