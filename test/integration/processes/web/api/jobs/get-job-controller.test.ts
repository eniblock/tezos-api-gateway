import { StatusCodes } from 'http-status-codes';
import supertest from 'supertest';
import { Jobs } from '../../../../../../src/const/interfaces/jobs';
import { JobStatus } from '../../../../../../src/const/job-status';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { insertJob } from '../../../../../../src/models/jobs';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreService } from '../../../../../../src/services/postgre';
import { TezosService } from '../../../../../../src/services/tezos';
import {
  postgreConfig,
  serverConfig,
  tezosNodeEdonetUrl,
} from '../../../../../__fixtures__/config';
import { resetTable } from '../../../../../__utils__/postgre';

describe('[processes/web/api/jobs] Get job controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeEdonetUrl);
  let job: Jobs;

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
    await resetTable(postgreService.pool, PostgreTables.JOBS);

    await webProcess.start();
    [job] = (
      await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        rawTransaction: 'raw_transaction',
      })
    ).rows;
  });

  beforeEach(async () => {
    jest
      .spyOn(webProcess.gatewayPool, 'getTezosService')
      .mockResolvedValue(tezosService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#forgeOperationAndCreateJob', () => {
    it('should return 400 when id is not a number', async () => {
      const { body, status } = await request.get('/api/job/a1b');

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.params.id should be integer',
        status: 400,
      });
    });

    it('should return 404 when job ID doesn`t exist', async () => {
      const { body, status } = await request.get('/api/job/13');

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: `Could not find job with this id: 13`,
        status: 404,
      });
    });

    it('should return 200 when everithing is fine', async () => {
      const { body, status } = await request.get('/api/job/1');

      expect(status).toEqual(StatusCodes.OK);
      expect(body).toEqual({ job });
    });
  });
});
